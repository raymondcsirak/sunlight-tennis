alter type "public"."achievement_type" rename to "achievement_type__old_version_to_be_dropped";

create type "public"."achievement_type" as enum ('first_match_win', 'matches_won_50', 'matches_won_100', 'streak_master_10', 'court_veteran_50', 'court_master_100', 'training_expert_25', 'training_master_50', 'training_legend_100', 'platform_pioneer', 'season_champion', 'matches_won_10', 'matches_won_25', 'streak_3', 'streak_5', 'court_bookings_10', 'court_bookings_25', 'training_sessions_10', 'first_login');

alter table "public"."achievements" alter column type type "public"."achievement_type" using type::text::"public"."achievement_type";

drop type "public"."achievement_type__old_version_to_be_dropped";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_daily_streak(user_id uuid)
 RETURNS TABLE(streak_days integer, xp_gained integer, streak_broken boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    last_date DATE;
    current_date DATE := CURRENT_DATE;
    base_streak_xp INTEGER := 20; -- Base XP for daily login as per PRD
    bonus_xp INTEGER := 0;
    v_streak_broken BOOLEAN := false;
BEGIN
    -- Get user's last activity date
    SELECT last_activity_date 
    INTO last_date
    FROM player_xp
    WHERE player_xp.user_id = update_daily_streak.user_id;

    -- If no record exists, create one
    IF last_date IS NULL THEN
        INSERT INTO player_xp (user_id, current_streak_days, last_activity_date)
        VALUES (user_id, 1, current_date);
        
        -- Return initial values
        RETURN QUERY SELECT 
            1::INTEGER,
            base_streak_xp::INTEGER,
            false::BOOLEAN;
        RETURN;
    END IF;

    -- Calculate days difference
    IF current_date - last_date = 1 THEN
        -- Consecutive day, increase streak
        UPDATE player_xp
        SET 
            current_streak_days = current_streak_days + 1,
            last_activity_date = current_date
        WHERE player_xp.user_id = update_daily_streak.user_id;
        
        -- Calculate bonus XP for milestone streaks
        SELECT 
            CASE 
                WHEN current_streak_days = 7 THEN 100  -- Weekly streak bonus
                WHEN current_streak_days = 30 THEN 500 -- Monthly streak bonus
                ELSE 0
            END INTO bonus_xp
        FROM player_xp
        WHERE player_xp.user_id = update_daily_streak.user_id;

    ELSIF current_date = last_date THEN
        -- Already logged in today, no streak update needed
        RETURN QUERY SELECT 
            current_streak_days::INTEGER,
            0::INTEGER,
            false::BOOLEAN
        FROM player_xp
        WHERE player_xp.user_id = update_daily_streak.user_id;
        RETURN;
    ELSE
        -- Streak broken
        UPDATE player_xp
        SET 
            current_streak_days = 1,
            last_activity_date = current_date
        WHERE player_xp.user_id = update_daily_streak.user_id;
        v_streak_broken := true;
    END IF;

    -- Record XP gain in history if there is XP to be gained
    IF base_streak_xp + bonus_xp > 0 THEN
        INSERT INTO xp_history (
            user_id,
            xp_amount,
            activity_type,
            description
        ) VALUES (
            update_daily_streak.user_id,
            base_streak_xp + bonus_xp,
            'login',
            CASE 
                WHEN bonus_xp > 0 THEN 'Daily login streak bonus'
                ELSE 'Daily login'
            END
        );
        
        -- Update total XP
        UPDATE player_xp
        SET current_xp = current_xp + base_streak_xp + bonus_xp
        WHERE player_xp.user_id = update_daily_streak.user_id;
    END IF;

    -- Return updated values
    RETURN QUERY 
    SELECT 
        current_streak_days::INTEGER,
        (base_streak_xp + bonus_xp)::INTEGER,
        v_streak_broken
    FROM player_xp
    WHERE player_xp.user_id = update_daily_streak.user_id;
END;
$function$
;


