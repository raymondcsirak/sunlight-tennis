-- Stergere tuturor politici existente
DROP POLICY IF EXISTS "Players can create and update their own selections" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can view selections for their matches" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can create selections for their matches" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can update their own selections" ON match_winner_selections;
DROP POLICY IF EXISTS "System can perform all operations" ON match_winner_selections;
DROP POLICY IF EXISTS "System can update matches" ON matches;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Activare RLS pe toate tabelele
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Creeaza politica pentru vizualizare selectii
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

-- Creeaza politica pentru inserare selectii
CREATE POLICY "Players can insert their own selections"
ON match_winner_selections FOR INSERT
TO authenticated
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

-- Creeaza politica pentru actualizare selectii
CREATE POLICY "Players can update their own selections"
ON match_winner_selections FOR UPDATE
TO authenticated
USING (
  auth.uid() = selector_id
  AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND m.winner_id IS NULL
  )
)
WITH CHECK (
  auth.uid() = selector_id
  AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND m.winner_id IS NULL
  )
);

-- Creeaza politica pentru operatii sistem (functie trigger)
CREATE POLICY "System can perform all operations"
ON match_winner_selections
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- Creeaza politica pentru operatii sistem pe tabelul matches
CREATE POLICY "System can update matches"
ON matches
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Creeaza politica pentru operatii sistem pe tabelul notifications
CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Creeaza politici de baza pentru matches si notifications
CREATE POLICY "Players can view their matches"
ON matches FOR SELECT
TO authenticated
USING (
  auth.uid() = player1_id OR 
  auth.uid() = player2_id
);

CREATE POLICY "Players can view their notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);
