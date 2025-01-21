-- Stergere politici existente pentru match_winner_selections
DROP POLICY IF EXISTS "Players can create or update selections for their matches" ON match_winner_selections;
DROP POLICY IF EXISTS "Players can update their own selections" ON match_winner_selections;

-- Stergere trigger existent
DROP TRIGGER IF EXISTS handle_winner_selection_trigger ON match_winner_selections;

-- Creeaza o singura politica care gestioneaza atat INSERT cat si UPDATE
CREATE POLICY "Players can create and update their own selections"
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

-- Recreeaza functia trigger pentru a gestiona notificari mai fiabil
CREATE OR REPLACE FUNCTION handle_winner_selection()
RETURNS TRIGGER AS $$
DECLARE
  match_record RECORD;
  other_selection RECORD;
  notification_error RECORD;
BEGIN
  -- Obtine detalii meci
  SELECT * INTO match_record
  FROM matches
  WHERE id = NEW.match_id;

  IF match_record IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

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
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    RAISE NOTICE 'Error in handle_winner_selection: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Creeaza trigger
CREATE TRIGGER handle_winner_selection_trigger
  AFTER INSERT OR UPDATE ON match_winner_selections
  FOR EACH ROW
  EXECUTE FUNCTION handle_winner_selection(); 