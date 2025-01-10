-- Create match_winner_selections table
CREATE TABLE IF NOT EXISTS match_winner_selections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    selector_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    selected_winner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, selector_id)
);

-- Enable RLS
ALTER TABLE match_winner_selections ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Function to validate and update match winner
CREATE OR REPLACE FUNCTION validate_and_update_match_winner()
RETURNS TRIGGER AS $$
DECLARE
    player1_selection UUID;
    player2_selection UUID;
    match_record RECORD;
BEGIN
    -- Get the match details
    SELECT player1_id, player2_id, status INTO match_record
    FROM matches
    WHERE id = NEW.match_id;

    -- Get both players' selections
    SELECT selected_winner_id INTO player1_selection
    FROM match_winner_selections
    WHERE match_id = NEW.match_id AND selector_id = match_record.player1_id;

    SELECT selected_winner_id INTO player2_selection
    FROM match_winner_selections
    WHERE match_id = NEW.match_id AND selector_id = match_record.player2_id;

    -- If both players have selected and they agree
    IF player1_selection IS NOT NULL AND player2_selection IS NOT NULL AND 
       player1_selection = player2_selection THEN
        
        -- Update the match winner
        UPDATE matches 
        SET winner_id = player1_selection,
            xp_awarded = false
        WHERE id = NEW.match_id;

        -- Create a notification for both players
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

-- Create trigger for winner validation
CREATE TRIGGER validate_match_winner
    AFTER INSERT OR UPDATE ON match_winner_selections
    FOR EACH ROW
    EXECUTE FUNCTION validate_and_update_match_winner();

-- Add updated_at trigger
CREATE TRIGGER update_match_winner_selections_updated_at
    BEFORE UPDATE ON match_winner_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add new notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'match_completed';

-- Function to check if a match needs winner selection
CREATE OR REPLACE FUNCTION check_match_needs_winner_selection(match_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    match_record RECORD;
    has_selected BOOLEAN;
BEGIN
    -- Get match details
    SELECT * INTO match_record
    FROM matches
    WHERE id = match_id;

    -- Check if the user is a player in this match
    IF user_id != match_record.player1_id AND user_id != match_record.player2_id THEN
        RETURN FALSE;
    END IF;

    -- Check if the match is completed and needs winner selection
    IF match_record.status != 'completed' OR match_record.winner_id IS NOT NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if the user has already made a selection
    SELECT EXISTS (
        SELECT 1 
        FROM match_winner_selections 
        WHERE match_id = match_record.id 
        AND selector_id = user_id
    ) INTO has_selected;

    -- Return true if the user hasn't made a selection yet
    RETURN NOT has_selected;
END;
$$ LANGUAGE plpgsql;
