-- Functie de actualizare streak-ului zilnic si acordare XP
CREATE OR REPLACE FUNCTION update_daily_streak(user_id UUID)
RETURNS TABLE (
    streak_days INTEGER,
    xp_gained INTEGER,
    streak_broken BOOLEAN
) AS $$
DECLARE
    last_date DATE;
    current_date DATE := CURRENT_DATE;
    base_streak_xp INTEGER := 20; -- XP de baza pentru login zilnic conform PRD
    bonus_xp INTEGER := 0;
    v_streak_broken BOOLEAN := false;
BEGIN
    -- Obtinere data ultimei activitati a user-ului
    SELECT last_activity_date 
    INTO last_date
    FROM player_xp
    WHERE player_xp.user_id = update_daily_streak.user_id;

    -- Daca nu exista record, creare unul
    IF last_date IS NULL THEN
        INSERT INTO player_xp (user_id, current_streak_days, last_activity_date)
        VALUES (user_id, 1, current_date);
        
        -- Return valori initiale
        RETURN QUERY SELECT 
            1::INTEGER,
            base_streak_xp::INTEGER,
            false::BOOLEAN;
        RETURN;
    END IF;

    -- Calculare diferenta de zile
    IF current_date - last_date = 1 THEN
        -- Zi consecutiva, creste streak
        UPDATE player_xp
        SET 
            current_streak_days = current_streak_days + 1,
            last_activity_date = current_date
        WHERE player_xp.user_id = update_daily_streak.user_id;
        
        -- Calculare XP bonus pentru streak-uri de mile
        SELECT 
            CASE 
                WHEN current_streak_days = 7 THEN 100  -- XP bonus saptamanal
                WHEN current_streak_days = 30 THEN 500 -- XP bonus lunar
                ELSE 0
            END INTO bonus_xp
        FROM player_xp
        WHERE player_xp.user_id = update_daily_streak.user_id;

    ELSIF current_date = last_date THEN
        -- Logat deja azi, nu e nevoie de update
        RETURN QUERY SELECT 
            current_streak_days::INTEGER,
            0::INTEGER,
            false::BOOLEAN
        FROM player_xp
        WHERE player_xp.user_id = update_daily_streak.user_id;
        RETURN;
    ELSE
        -- Streak rupt
        UPDATE player_xp
        SET 
            current_streak_days = 1,
            last_activity_date = current_date
        WHERE player_xp.user_id = update_daily_streak.user_id;
        v_streak_broken := true;
    END IF;

    -- Recordare XP obtinut in istoric daca exista XP de obtinut
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
        
        -- Actualizare total XP
        UPDATE player_xp
        SET current_xp = current_xp + base_streak_xp + bonus_xp
        WHERE player_xp.user_id = update_daily_streak.user_id;
    END IF;

    -- Return valori actualizate
    RETURN QUERY 
    SELECT 
        current_streak_days::INTEGER,
        (base_streak_xp + bonus_xp)::INTEGER,
        v_streak_broken
    FROM player_xp
    WHERE player_xp.user_id = update_daily_streak.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;