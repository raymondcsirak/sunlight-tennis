-- First, update any matches that have winners but aren't marked as completed
UPDATE matches
SET status = 'completed'
WHERE winner_id IS NOT NULL AND status = 'scheduled';

-- Drop existing triggers to avoid race conditions
DROP TRIGGER IF EXISTS handle_match_completion_trigger ON matches;
DROP TRIGGER IF EXISTS handle_winner_selection_trigger ON match_winner_selections;

-- Recreate handle_winner_selection with proper status updates
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
  -- Get the match details
  SELECT * INTO match_record
  FROM matches
  WHERE id = NEW.match_id;

  IF match_record IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Get the other player's selection if it exists
  SELECT * INTO other_selection
  FROM match_winner_selections
  WHERE match_id = NEW.match_id
  AND selector_id != NEW.selector_id;

  -- If both players have selected and agree
  IF other_selection IS NOT NULL AND other_selection.selected_winner_id = NEW.selected_winner_id THEN
    -- Update match winner and status in a single update
    UPDATE matches
    SET winner_id = NEW.selected_winner_id,
        xp_awarded = false,
        status = 'completed'
    WHERE id = NEW.match_id;

    -- Recalculate stats for both players
    PERFORM calculate_player_stats(match_record.player1_id);
    PERFORM calculate_player_stats(match_record.player2_id);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a single trigger for winner selection that handles everything
CREATE TRIGGER handle_winner_selection_trigger
  AFTER INSERT OR UPDATE ON match_winner_selections
  FOR EACH ROW
  EXECUTE FUNCTION handle_winner_selection();

-- Create a function to handle XP awards separately
CREATE OR REPLACE FUNCTION handle_match_xp_awards()
RETURNS TRIGGER AS $$
DECLARE
    v_player1_name TEXT;
    v_player2_name TEXT;
BEGIN
    -- Only proceed if status changed to completed and XP hasn't been awarded yet
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NOT OLD.xp_awarded THEN
        -- Get player names
        SELECT p1.full_name, p2.full_name INTO v_player1_name, v_player2_name
        FROM profiles p1, profiles p2
        WHERE p1.id = NEW.player1_id AND p2.id = NEW.player2_id;

        -- Award XP for winning
        PERFORM award_xp(
            NEW.winner_id,
            'match_won',
            format('Won match against %s', 
                CASE 
                    WHEN NEW.winner_id = NEW.player1_id THEN v_player2_name 
                    ELSE v_player1_name 
                END
            )
        );

        -- Award XP for participation to both players
        PERFORM award_xp(
            NEW.player1_id,
            'match_played',
            format('Played match against %s', v_player2_name)
        );
        
        PERFORM award_xp(
            NEW.player2_id,
            'match_played',
            format('Played match against %s', v_player1_name)
        );

        -- Mark XP as awarded
        NEW.xp_awarded := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for XP awards
CREATE TRIGGER handle_match_xp_awards_trigger
    BEFORE UPDATE OF status ON matches
    FOR EACH ROW
    EXECUTE FUNCTION handle_match_xp_awards(); 