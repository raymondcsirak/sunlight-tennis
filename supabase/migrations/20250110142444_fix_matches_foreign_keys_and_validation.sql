-- Stergere constrangeri de foreign key existente
ALTER TABLE matches
DROP CONSTRAINT IF EXISTS matches_player1_id_fkey,
DROP CONSTRAINT IF EXISTS matches_player2_id_fkey;

-- Adaugare constrangeri de foreign key explicite
ALTER TABLE matches
ADD CONSTRAINT matches_player1_id_fkey
FOREIGN KEY (player1_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

ALTER TABLE matches
ADD CONSTRAINT matches_player2_id_fkey
FOREIGN KEY (player2_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Stergere trigger si functie daca exista
DROP TRIGGER IF EXISTS validate_match_selection_trigger ON match_winner_selections;
DROP FUNCTION IF EXISTS validate_match_selection();

-- Functie pentru validare selector si castigator
CREATE OR REPLACE FUNCTION validate_match_selection()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica daca selector este un jucator in meci
    IF NOT EXISTS (
        SELECT 1 FROM matches 
        WHERE id = NEW.match_id 
        AND (player1_id = NEW.selector_id OR player2_id = NEW.selector_id)
    ) THEN
        RAISE EXCEPTION 'Selector must be a player in the match';
    END IF;

    -- Verifica daca castigatorul ales este un jucator in meci
    IF NOT EXISTS (
        SELECT 1 FROM matches 
        WHERE id = NEW.match_id 
        AND (player1_id = NEW.selected_winner_id OR player2_id = NEW.selected_winner_id)
    ) THEN
        RAISE EXCEPTION 'Selected winner must be a player in the match';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Stergere trigger daca exista
DROP TRIGGER IF EXISTS validate_match_selection_trigger ON match_winner_selections;

-- Creare trigger
CREATE TRIGGER validate_match_selection_trigger
    BEFORE INSERT OR UPDATE ON match_winner_selections
    FOR EACH ROW
    EXECUTE FUNCTION validate_match_selection();