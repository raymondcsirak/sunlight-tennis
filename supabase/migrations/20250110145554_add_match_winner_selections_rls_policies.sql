-- Stergere politici existente
DROP POLICY IF EXISTS "Users can view their own selections" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can create selections for their matches" ON match_winner_selections;
DROP POLICY IF EXISTS "Users can update their own selections" ON match_winner_selections;

-- Activare RLS pe tabelul match_winner_selections
ALTER TABLE match_winner_selections ENABLE ROW LEVEL SECURITY;

-- Politica pentru vizualizare selectiilor proprii
CREATE POLICY "Users can view their own selections"
ON match_winner_selections FOR SELECT
TO authenticated
USING (
  auth.uid() = selector_id
);

-- Politica pentru creare selectiilor pentru meciurile proprii
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
    AND auth.uid() = selector_id -- Asigura ca utilizatorii pot selecta doar ca ei insisi
  )
);

-- Politica pentru actualizare selectiilor proprii
CREATE POLICY "Users can update their own selections"
ON match_winner_selections FOR UPDATE
TO authenticated
USING (
  auth.uid() = selector_id
);
