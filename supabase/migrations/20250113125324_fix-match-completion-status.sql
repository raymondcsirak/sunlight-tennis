-- Actualizeaza meciurile existente cu winneri la statusul completat
UPDATE matches 
SET status = 'completed'
WHERE winner_id IS NOT NULL;

-- Sterge si recreeaza functia handle_winner_selection
CREATE OR REPLACE FUNCTION handle_winner_selection()
RETURNS TRIGGER AS $$
DECLARE
  match_record RECORD;
  other_selection RECORD;
  notification_error RECORD;
  winner_stats RECORD;
  winner_total_matches INT;
  achievements JSONB;
BEGIN
  -- Obtine detaliile meciului
  SELECT * INTO match_record
  FROM matches
  WHERE id = NEW.match_id;

  IF match_record IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Obtine alegerea altui player daca exista
  SELECT * INTO other_selection
  FROM match_winner_selections
  WHERE match_id = NEW.match_id
  AND selector_id != NEW.selector_id;

  -- Daca ambii player-i au ales si sunt de acord
  IF other_selection IS NOT NULL AND other_selection.selected_winner_id = NEW.selected_winner_id THEN
    -- Actualizeaza winner-ul meciului si statusul
    UPDATE matches
    SET winner_id = NEW.selected_winner_id,
        xp_awarded = false,
        status = 'completed'
    WHERE id = NEW.match_id;

    -- Obtine stats-urile winner-ului
    SELECT * INTO winner_stats
    FROM player_stats
    WHERE user_id = NEW.selected_winner_id;

    -- Calculeaza totalul de meciuri castigate pentru winner
    SELECT COUNT(*) INTO winner_total_matches
    FROM matches
    WHERE winner_id = NEW.selected_winner_id;

    -- Initializeaza achievements ca un array JSONB
    achievements := '[]'::JSONB;

    -- Verifica daca a castigat primul meci
    IF winner_total_matches = 1 THEN
      achievements := achievements || jsonb_build_object(
        'type', 'first_match_win',
        'name', 'First Victory',
        'description', 'Won your first match!'
      );
    END IF;

    -- Verifica daca a castigat un anumit numar de meciuri
    IF winner_total_matches IN (10, 25, 50, 100) THEN
      achievements := achievements || jsonb_build_object(
        'type', 'matches_won_' || winner_total_matches::TEXT,
        'name', winner_total_matches::TEXT || ' Matches Won',
        'description', 'Won ' || winner_total_matches::TEXT || ' matches!'
      );
    END IF;

    -- Incheie achievements daca au fost castigate
    IF jsonb_array_length(achievements) > 0 THEN
      PERFORM award_achievements_with_notifications(
        NEW.selected_winner_id,
        achievements
      );
    END IF;

    -- Creeaza notificari pentru ambii player-i
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

  -- Daca ambii player-i au ales dar nu sunt de acord
  ELSIF other_selection IS NOT NULL AND other_selection.selected_winner_id != NEW.selected_winner_id THEN
    -- Creeaza notificari de dispute
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
    -- Afiseaza eroarea si re-arunca
    RAISE NOTICE 'Error in handle_winner_selection: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
