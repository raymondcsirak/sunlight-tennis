-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own selections" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can create selections for their matches" ON match_winner_selections;
DROP POLICY IF EXISTS "Users can update their own selections" ON match_winner_selections;

-- Enable RLS on match_winner_selections table
ALTER TABLE match_winner_selections ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own selections
CREATE POLICY "Users can view their own selections"
ON match_winner_selections FOR SELECT
TO authenticated
USING (
  auth.uid() = selector_id
);

-- Policy to allow players to create selections for their matches
CREATE POLICY "Players can create selections for their matches"
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
    AND auth.uid() = selector_id -- Ensure users can only select as themselves
  )
);

-- Policy to allow users to update their own selections
CREATE POLICY "Users can update their own selections"
ON match_winner_selections FOR UPDATE
TO authenticated
USING (
  auth.uid() = selector_id
);
