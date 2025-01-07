-- Function to update user's daily streak and grant XP
CREATE OR REPLACE FUNCTION update_daily_streak(user_id UUID)
RETURNS TABLE (
    streak_days INTEGER,
    xp_gained INTEGER,
    streak_broken BOOLEAN
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;