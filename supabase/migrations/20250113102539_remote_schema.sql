alter table "public"."achievements" drop constraint "achievements_user_id_type_key";

drop function if exists "public"."award_achievement"(p_user_id uuid, p_type achievement_type, p_name text, p_description text, p_tier achievement_tier, p_icon_path text, p_metadata jsonb);

drop function if exists "public"."retroactively_award_achievements"(p_user_id uuid);

drop index if exists "public"."achievements_user_id_type_key";

alter type "public"."achievement_type" rename to "achievement_type__old_version_to_be_dropped";

create type "public"."achievement_type" as enum ('WELCOME', 'DEDICATION', 'VICTORY', 'STREAK', 'TOURNAMENT', 'BOOKING', 'TRAINING', 'first_match_win', 'matches_won_10', 'matches_won_25', 'matches_won_50', 'matches_won_100');

alter table "public"."achievements" alter column type type "public"."achievement_type" using type::text::"public"."achievement_type";

drop type "public"."achievement_type__old_version_to_be_dropped";

alter table "public"."achievements" drop column "icon_path";

alter table "public"."achievements" drop column "tier";

alter table "public"."achievements" add column "earned_at" timestamp with time zone default timezone('utc'::text, now());

alter table "public"."achievements" add column "icon" text;

alter table "public"."achievements" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."achievements" alter column "description" drop not null;

alter table "public"."achievements" alter column "id" set default uuid_generate_v4();

alter table "public"."achievements" enable row level security;

drop type "public"."achievement_tier";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.award_achievements_with_notifications(p_user_id uuid, p_achievements jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  achievement RECORD;
BEGIN
  -- Insert achievements and corresponding notifications in a single transaction
  FOR achievement IN SELECT * FROM jsonb_array_elements(p_achievements)
  LOOP
    -- Insert the achievement
    INSERT INTO achievements (
      user_id,
      type,
      name,
      description,
      metadata
    ) VALUES (
      p_user_id,
      (achievement.value->>'type')::achievement_type,
      achievement.value->>'name',
      achievement.value->>'description',
      COALESCE((achievement.value->>'metadata')::jsonb, '{}'::jsonb)
    )
    ON CONFLICT (user_id, type) DO NOTHING;

    -- Only create notification if achievement was inserted (not already earned)
    IF FOUND THEN
      -- Insert the notification
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        p_user_id,
        'achievement',
        'Achievement Unlocked! 🏆',
        achievement.value->>'name',
        jsonb_build_object(
          'type', achievement.value->>'type',
          'name', achievement.value->>'name',
          'description', achievement.value->>'description',
          'metadata', COALESCE((achievement.value->>'metadata')::jsonb, '{}'::jsonb)
        )
      );
    END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_achievement_details(achievement_type achievement_type)
 RETURNS TABLE(name text, description text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY SELECT
        CASE achievement_type
            WHEN 'first_match' THEN 'First Match'
            WHEN 'streak_7' THEN 'Week Warrior'
            WHEN 'matches_10' THEN 'Match Master'
            WHEN 'level_10' THEN 'Rising Star'
        END,
        CASE achievement_type
            WHEN 'first_match' THEN 'Played your first tennis match'
            WHEN 'streak_7' THEN 'Maintained a 7-day activity streak'
            WHEN 'matches_10' THEN 'Played 10 matches'
            WHEN 'level_10' THEN 'Reached level 10'
        END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_winner_selection()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
    -- Update match winner
    UPDATE matches
    SET winner_id = NEW.selected_winner_id,
        xp_awarded = false
    WHERE id = NEW.match_id;

    -- Get winner's stats
    SELECT * INTO winner_stats
    FROM player_stats
    WHERE user_id = NEW.selected_winner_id;

    -- Calculate total matches won for winner
    SELECT COUNT(*) INTO winner_total_matches
    FROM matches
    WHERE winner_id = NEW.selected_winner_id;

    -- Initialize achievements as a JSONB array
    achievements := '[]'::JSONB;

    -- Check for first match win achievement
    IF winner_total_matches = 1 THEN
      achievements := achievements || jsonb_build_object(
        'type', 'first_match_win',
        'name', 'First Victory',
        'description', 'Won your first match!'
      );
    END IF;

    -- Check for match milestones (10, 25, 50, 100 matches)
    IF winner_total_matches IN (10, 25, 50, 100) THEN
      achievements := achievements || jsonb_build_object(
        'type', 'matches_won_' || winner_total_matches::TEXT,
        'name', winner_total_matches::TEXT || ' Matches Won',
        'description', 'Won ' || winner_total_matches::TEXT || ' matches!'
      );
    END IF;

    -- Award achievements if any were earned
    IF jsonb_array_length(achievements) > 0 THEN
      PERFORM award_achievements_with_notifications(
        NEW.selected_winner_id,
        achievements
      );
    END IF;

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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE NOTICE 'Error in handle_winner_selection: %', SQLERRM;
    RAISE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.retroactively_award_achievements(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  total_wins INT;
  achievements JSONB := '[]'::JSONB;
BEGIN
  -- Get total wins for the user
  SELECT COUNT(*) INTO total_wins
  FROM matches
  WHERE winner_id = p_user_id;

  -- Check for first win achievement
  IF total_wins >= 1 THEN
    achievements := achievements || jsonb_build_object(
      'type', 'first_match_win',
      'name', 'First Victory',
      'description', 'Won your first match!'
    );
  END IF;

  -- Check for milestone achievements (10, 25, 50, 100)
  IF total_wins >= 10 THEN
    achievements := achievements || jsonb_build_object(
      'type', 'matches_won_10',
      'name', '10 Matches Won',
      'description', 'Won 10 matches!'
    );
  END IF;

  IF total_wins >= 25 THEN
    achievements := achievements || jsonb_build_object(
      'type', 'matches_won_25',
      'name', '25 Matches Won',
      'description', 'Won 25 matches!'
    );
  END IF;

  IF total_wins >= 50 THEN
    achievements := achievements || jsonb_build_object(
      'type', 'matches_won_50',
      'name', '50 Matches Won',
      'description', 'Won 50 matches!'
    );
  END IF;

  IF total_wins >= 100 THEN
    achievements := achievements || jsonb_build_object(
      'type', 'matches_won_100',
      'name', '100 Matches Won',
      'description', 'Won 100 matches!'
    );
  END IF;

  -- Award achievements if any were earned
  IF jsonb_array_length(achievements) > 0 THEN
    PERFORM award_achievements_with_notifications(p_user_id, achievements);
  END IF;
END;
$function$
;

create policy "Users can insert their own achievements"
on "public"."achievements"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own achievements"
on "public"."achievements"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


