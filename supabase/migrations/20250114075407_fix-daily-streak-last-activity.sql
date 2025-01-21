-- Sistem de activitate zilnica
-- Implementeaza:
-- - Actualizare automata streak la activitate
-- - Verificare ultima activitate pentru mentinere streak
-- - Resetare streak la inactivitate
-- - Acordare XP bonus pentru streak-uri

-- Modifica functia update_daily_streak pentru a gestiona NULL last_activity_date
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
    -- Obtine data ultimei activitati a user-ului
    SELECT last_activity_date 
    INTO last_date
    FROM player_xp
    WHERE player_xp.user_id = update_daily_streak.user_id;

    -- Daca nu exista un record sau last_activity_date este NULL, actualizeaza-l
    IF last_date IS NULL THEN
        UPDATE player_xp
        SET 
            current_streak_days = 1,
            last_activity_date = current_date
        WHERE player_xp.user_id = update_daily_streak.user_id;
        
        -- Daca nu a fost actualizat niciun record, creeaza unul
        IF NOT FOUND THEN
            INSERT INTO player_xp (
                user_id, 
                current_streak_days, 
                last_activity_date,
                current_xp,
                current_level
            )
            VALUES (
                user_id, 
                1, 
                current_date,
                0,
                1
            )
            ON CONFLICT (user_id) DO UPDATE
            SET 
                current_streak_days = 1,
                last_activity_date = current_date;
        END IF;
        
        -- Returneaza valorile initiale
        RETURN QUERY SELECT 
            1::INTEGER,
            base_streak_xp::INTEGER,
            false::BOOLEAN;
        RETURN;
    END IF;

    -- Restul functiei ramane la fel
    IF current_date - last_date = 1 THEN
        -- Zi consecutiva, creste streak
        UPDATE player_xp
        SET 
            current_streak_days = current_streak_days + 1,
            last_activity_date = current_date
        WHERE player_xp.user_id = update_daily_streak.user_id;
        
        -- Calculeaza XP bonus pentru streak-uri de 7 zile si 30 zile
        SELECT 
            CASE 
                WHEN current_streak_days = 7 THEN 100  -- Weekly streak bonus
                WHEN current_streak_days = 30 THEN 500 -- Monthly streak bonus
                ELSE 0
            END INTO bonus_xp
        FROM player_xp
        WHERE player_xp.user_id = update_daily_streak.user_id;

    ELSIF current_date = last_date THEN
        -- A fost logat in aceasta zi, nu e nevoie de update
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

    -- Inregistreaza XP castigat in istoric daca exista XP de castigat
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
        
        -- Actualizeaza total XP
        UPDATE player_xp
        SET current_xp = current_xp + base_streak_xp + bonus_xp
        WHERE player_xp.user_id = update_daily_streak.user_id;
    END IF;

    -- Returneaza valorile actualizate
    RETURN QUERY 
    SELECT 
        current_streak_days::INTEGER,
        (base_streak_xp + bonus_xp)::INTEGER,
        v_streak_broken
    FROM player_xp
    WHERE player_xp.user_id = update_daily_streak.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizeaza recordurile existente player_xp care au NULL last_activity_date
UPDATE player_xp
SET last_activity_date = created_at::DATE
WHERE last_activity_date IS NULL;