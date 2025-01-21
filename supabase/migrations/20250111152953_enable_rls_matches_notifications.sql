-- Activare RLS pe tabele
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Stergere politici existente daca sunt
DROP POLICY IF EXISTS "Players can view their matches" ON matches;
DROP POLICY IF EXISTS "Players can view their notifications" ON notifications;
DROP POLICY IF EXISTS "System can update matches" ON matches;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Creeaza politici de baza pentru matches si notifications
CREATE POLICY "Players can view their matches"
ON matches FOR SELECT
TO authenticated
USING (
  auth.uid() = player1_id OR 
  auth.uid() = player2_id
);

CREATE POLICY "System can update matches"
ON matches FOR UPDATE
USING (true)
WITH CHECK (true);

-- Creeaza politici de baza pentru notifications
CREATE POLICY "Players can view their notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);
