-- Drop existing foreign keys if they exist
ALTER TABLE matches
DROP CONSTRAINT IF EXISTS matches_player1_id_fkey,
DROP CONSTRAINT IF EXISTS matches_player2_id_fkey;

-- Add explicit foreign key constraints
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

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS validate_match_selection_trigger ON match_winner_selections;
DROP FUNCTION IF EXISTS validate_match_selection();

-- Function to validate selector and winner
CREATE OR REPLACE FUNCTION validate_match_selection()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if selector is a player in the match
    IF NOT EXISTS (
        SELECT 1 FROM matches 
        WHERE id = NEW.match_id 
        AND (player1_id = NEW.selector_id OR player2_id = NEW.selector_id)
    ) THEN
        RAISE EXCEPTION 'Selector must be a player in the match';
    END IF;

    -- Check if selected winner is a player in the match
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

-- Create trigger for validation
CREATE TRIGGER validate_match_selection_trigger
    BEFORE INSERT OR UPDATE ON match_winner_selections
    FOR EACH ROW
    EXECUTE FUNCTION validate_match_selection();
