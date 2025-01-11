-- Drop existing trigger and function
DROP TRIGGER IF EXISTS handle_winner_selection_trigger ON match_winner_selections;
DROP FUNCTION IF EXISTS handle_winner_selection();

-- Simplify RLS policies
DROP POLICY IF EXISTS "Players can create and update their own selections" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can view selections for their matches" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can create selections for their matches" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can update their own selections" ON match_winner_selections;
DROP POLICY IF EXISTS "System can perform all operations" ON match_winner_selections;

-- Create simple policies for match_winner_selections
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

CREATE POLICY "Players can manage their own selections"
ON match_winner_selections
FOR ALL
TO authenticated
USING (
  auth.uid() = selector_id
  AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND (
      auth.uid() = m.player1_id OR 
      auth.uid() = m.player2_id
    )
    AND m.winner_id IS NULL
  )
)
WITH CHECK (
  auth.uid() = selector_id
  AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND (
      auth.uid() = m.player1_id OR 
      auth.uid() = m.player2_id
    )
    AND m.winner_id IS NULL
  )
);
