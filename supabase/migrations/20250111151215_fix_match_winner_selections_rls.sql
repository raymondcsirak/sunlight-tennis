-- Stergere politici existente
DROP POLICY IF EXISTS "Users can view their own selections" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can create selections for their matches" ON match_winner_selections;
DROP POLICY IF EXISTS "Users can update their own selections" ON match_winner_selections;

-- Stergere trigger daca exista
DROP TRIGGER IF EXISTS validate_match_winner ON match_winner_selections;
DROP FUNCTION IF EXISTS validate_and_update_match_winner();

-- Activare RLS pe tabelul match_winner_selections
ALTER TABLE match_winner_selections ENABLE ROW LEVEL SECURITY;

-- Politica pentru vizualizare selectiilor pentru meciurile proprii
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

-- Politica pentru creare sau actualizare selectiilor pentru meciurile proprii
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
    AND m.winner_id IS NULL -- Doar permite selectii daca nu a fost stabilit un castigator
    AND auth.uid() = selector_id -- Asigura ca utilizatorii pot selecta doar ca ei insisi
  )
);

-- Politica pentru actualizare selectiilor proprii
CREATE POLICY "Players can update their own selections"
ON match_winner_selections FOR UPDATE
TO authenticated
USING (
  auth.uid() = selector_id
  AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND m.winner_id IS NULL -- Doar permite actualizari daca nu a fost stabilit un castigator
  )
)
WITH CHECK (
  auth.uid() = selector_id
  AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND m.winner_id IS NULL -- Doar permite actualizari daca nu a fost stabilit un castigator
  )
);

-- Functie pentru gestionare castigator
CREATE OR REPLACE FUNCTION handle_winner_selection()
RETURNS TRIGGER AS $$
DECLARE
  match_record RECORD;
  other_selection RECORD;
BEGIN
  -- Obtine detalii meci
  SELECT * INTO match_record
  FROM matches
  WHERE id = NEW.match_id;

  -- Obtine selectia altui jucator daca exista
  SELECT * INTO other_selection
  FROM match_winner_selections
  WHERE match_id = NEW.match_id
  AND selector_id != NEW.selector_id;

  -- Daca ambii jucatori au selectat si sunt de acord
  IF other_selection IS NOT NULL AND other_selection.selected_winner_id = NEW.selected_winner_id THEN
    -- Actualizeaza castigatorul meciului
    UPDATE matches
    SET winner_id = NEW.selected_winner_id,
        xp_awarded = false
    WHERE id = NEW.match_id;

    -- Creeaza notificari pentru ambii jucatori
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
  -- Daca ambii jucatori au selectat dar nu sunt de acord
  ELSIF other_selection IS NOT NULL AND other_selection.selected_winner_id != NEW.selected_winner_id THEN
    -- Creeaza notificari de disputa
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

-- Creeaza trigger pentru gestionare castigator
CREATE TRIGGER handle_winner_selection_trigger
  AFTER INSERT OR UPDATE ON match_winner_selections
  FOR EACH ROW
  EXECUTE FUNCTION handle_winner_selection();

-- Adauga constrangeri de unicitate pentru a preveni selectii duplicate
ALTER TABLE match_winner_selections
DROP CONSTRAINT IF EXISTS unique_selector_per_match,
ADD CONSTRAINT unique_selector_per_match UNIQUE (match_id, selector_id);