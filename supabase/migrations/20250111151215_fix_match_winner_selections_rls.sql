-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own selections" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can create selections for their matches" ON match_winner_selections;
DROP POLICY IF EXISTS "Users can update their own selections" ON match_winner_selections;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_match_winner ON match_winner_selections;
DROP FUNCTION IF EXISTS validate_and_update_match_winner();

-- Enable RLS on match_winner_selections table
ALTER TABLE match_winner_selections ENABLE ROW LEVEL SECURITY;

-- Policy to allow players to view selections for their matches
CREATE POLICY "Players can view selections for their matches"
ON match_winner_selections FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND (
      auth.uid() = m.player1_id OR 
      auth.uid() = m.player2_id
    )
  )
);

-- Policy to allow players to create or update selections for their matches
CREATE POLICY "Players can create or update selections for their matches"
ON match_winner_selections FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND (
      auth.uid() = m.player1_id OR 
      auth.uid() = m.player2_id
    )
    AND m.winner_id IS NULL -- Only allow selections if no winner is set
    AND auth.uid() = selector_id -- Ensure users can only select as themselves
  )
);

-- Policy to allow players to update their own selections
CREATE POLICY "Players can update their own selections"
ON match_winner_selections FOR UPDATE
TO authenticated
USING (
  auth.uid() = selector_id
  AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND m.winner_id IS NULL -- Only allow updates if no winner is set
  )
)
WITH CHECK (
  auth.uid() = selector_id
  AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND m.winner_id IS NULL -- Only allow updates if no winner is set
  )
);

-- Function to handle winner selection
CREATE OR REPLACE FUNCTION handle_winner_selection()
RETURNS TRIGGER AS $$
DECLARE
  match_record RECORD;
  other_selection RECORD;
BEGIN
  -- Get the match details
  SELECT * INTO match_record
  FROM matches
  WHERE id = NEW.match_id;

  -- Get the other player's selection if it exists
  SELECT * INTO other_selection
  FROM match_winner_selections
  WHERE match_id = NEW.match_id
  AND selector_id != NEW.selector_id;

  -- If both players have selected and agree
  IF other_selection IS NOT NULL AND other_selection.selected_winner_id = NEW.selected_winner_id THEN
    -- Update match winner
    UPDATE matches
    SET winner_id = NEW.selected_winner_id,
        xp_awarded = false
    WHERE id = NEW.match_id;

    -- Create notifications for both players
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES
      (match_record.player1_id, 'match_completed', 'Match Result Confirmed',
       CASE WHEN match_record.player1_id = NEW.selected_winner_id
         THEN 'Congratulations! You won the match!'
         ELSE 'Match completed. Better luck next time!'
       END,
       jsonb_build_object('match_id', NEW.match_id, 'winner_id', NEW.selected_winner_id)),
      (match_record.player2_id, 'match_completed', 'Match Result Confirmed',
       CASE WHEN match_record.player2_id = NEW.selected_winner_id
         THEN 'Congratulations! You won the match!'
         ELSE 'Match completed. Better luck next time!'
       END,
       jsonb_build_object('match_id', NEW.match_id, 'winner_id', NEW.selected_winner_id));
  -- If both players have selected but disagree
  ELSIF other_selection IS NOT NULL AND other_selection.selected_winner_id != NEW.selected_winner_id THEN
    -- Create dispute notifications
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES
      (match_record.player1_id, 'match_dispute', 'Match Result Dispute',
       'There is a disagreement about the match result. Both players selected different winners. Please discuss and update your selections.',
       jsonb_build_object('match_id', NEW.match_id)),
      (match_record.player2_id, 'match_dispute', 'Match Result Dispute',
       'There is a disagreement about the match result. Both players selected different winners. Please discuss and update your selections.',
       jsonb_build_object('match_id', NEW.match_id));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for winner selection handling
CREATE TRIGGER handle_winner_selection_trigger
  AFTER INSERT OR UPDATE ON match_winner_selections
  FOR EACH ROW
  EXECUTE FUNCTION handle_winner_selection();

-- Add unique constraint to prevent duplicate selections
ALTER TABLE match_winner_selections
DROP CONSTRAINT IF EXISTS unique_selector_per_match,
ADD CONSTRAINT unique_selector_per_match UNIQUE (match_id, selector_id);
