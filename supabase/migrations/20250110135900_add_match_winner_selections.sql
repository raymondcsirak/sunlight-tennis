-- Sistem de gestionare meciuri
-- Implementeaza:
-- - Tabelul pentru meciuri si rezultate
-- - Sistem de selectare castigator cu validare
-- - Actualizare automata statistici jucatori
-- - Notificari pentru confirmari rezultate

-- Creeaza tabelul pentru selectii de castigator
CREATE TABLE IF NOT EXISTS match_winner_selections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    selector_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    selected_winner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, selector_id)
);

-- Activeaza RLS
ALTER TABLE match_winner_selections ENABLE ROW LEVEL SECURITY;

-- Creeaza politici
CREATE POLICY "Users can view winner selections for their matches"
    ON match_winner_selections FOR SELECT
    USING (
        match_id IN (
            SELECT id FROM matches 
            WHERE player1_id = auth.uid() 
            OR player2_id = auth.uid()
        )
    );

CREATE POLICY "Users can create winner selections for their matches"
    ON match_winner_selections FOR INSERT
    WITH CHECK (
        selector_id = auth.uid() AND
        match_id IN (
            SELECT id FROM matches 
            WHERE (player1_id = auth.uid() OR player2_id = auth.uid())
            AND status = 'completed'
            AND winner_id IS NULL
        )
    );

CREATE POLICY "Users can update their own selections"
    ON match_winner_selections FOR UPDATE
    USING (selector_id = auth.uid())
    WITH CHECK (selector_id = auth.uid());

-- Functie pentru validare si actualizare castigator meci
CREATE OR REPLACE FUNCTION validate_and_update_match_winner()
RETURNS TRIGGER AS $$
DECLARE
    player1_selection UUID;
    player2_selection UUID;
    match_record RECORD;
BEGIN
    -- Obtine detalii despre meci
    SELECT player1_id, player2_id, status INTO match_record
    FROM matches
    WHERE id = NEW.match_id;

    -- Obtine selectii ambilor jucatori
    SELECT selected_winner_id INTO player1_selection
    FROM match_winner_selections
    WHERE match_id = NEW.match_id AND selector_id = match_record.player1_id;

    SELECT selected_winner_id INTO player2_selection
    FROM match_winner_selections
    WHERE match_id = NEW.match_id AND selector_id = match_record.player2_id;

    -- Daca ambii jucatori au ales si sunt de acord
    IF player1_selection IS NOT NULL AND player2_selection IS NOT NULL AND 
       player1_selection = player2_selection THEN
        
        -- Actualizeaza castigatorul meciului
        UPDATE matches 
        SET winner_id = player1_selection,
            xp_awarded = false
        WHERE id = NEW.match_id;

        -- Creeaza notificare pentru ambii jucatori
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT 
            user_id,
            'match_completed'::notification_type,
            'Match Result Confirmed',
            CASE 
                WHEN user_id = player1_selection 
                THEN 'Congratulations! You won the match!'
                ELSE 'Match completed. Better luck next time!'
            END,
            jsonb_build_object(
                'match_id', NEW.match_id,
                'winner_id', player1_selection
            )
        FROM unnest(ARRAY[match_record.player1_id, match_record.player2_id]) AS user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creeaza trigger pentru validare castigator
CREATE TRIGGER validate_match_winner
    AFTER INSERT OR UPDATE ON match_winner_selections
    FOR EACH ROW
    EXECUTE FUNCTION validate_and_update_match_winner();

-- Creeaza trigger pentru updated_at
CREATE TRIGGER update_match_winner_selections_updated_at
    BEFORE UPDATE ON match_winner_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adauga tipuri de notificare noi
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'match_completed';

-- Functie pentru verificare daca un meci are nevoie de selectie castigator
CREATE OR REPLACE FUNCTION check_match_needs_winner_selection(match_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    match_record RECORD;
    has_selected BOOLEAN;
BEGIN
    -- Obtine detalii despre meci
    SELECT * INTO match_record
    FROM matches
    WHERE id = match_id;

    -- Verifica daca user-ul este un participant in acest meci
    IF user_id != match_record.player1_id AND user_id != match_record.player2_id THEN
        RETURN FALSE;
    END IF;

    -- Verifica daca meciul este finalizat si are nevoie de selectie castigator
    IF match_record.status != 'completed' OR match_record.winner_id IS NOT NULL THEN
        RETURN FALSE;
    END IF;

    -- Verifica daca user-ul a deja facut o selectie
    SELECT EXISTS (
        SELECT 1 
        FROM match_winner_selections 
        WHERE match_id = match_record.id 
        AND selector_id = user_id
    ) INTO has_selected;

    -- Returneaza true daca user-ul nu a facut o selectie
    RETURN NOT has_selected;
END;
$$ LANGUAGE plpgsql;