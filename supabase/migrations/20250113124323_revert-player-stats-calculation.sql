-- Sterge si recreeaza functia calculate_player_stats cu count-ul corect de victorii
CREATE OR REPLACE FUNCTION calculate_player_stats(player_uuid UUID)
RETURNS void AS $$
DECLARE
    total_count INTEGER;
    wins_count INTEGER;
    win_rate_calc NUMERIC(5,2);
    player_level INTEGER;
    current_streak INTEGER;
BEGIN
    -- Obtine totalul de meciuri si castiguri cu query corect
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE winner_id = player_uuid) as wins
    INTO total_count, wins_count
    FROM matches
    WHERE (player1_id = player_uuid OR player2_id = player_uuid)
        AND status = 'completed';

    -- Calculeaza streak-ul curent
    WITH ordered_matches AS (
        SELECT 
            winner_id = player_uuid as is_win,
            created_at
        FROM matches
        WHERE (player1_id = player_uuid OR player2_id = player_uuid)
            AND status = 'completed'
        ORDER BY created_at DESC
    )
    SELECT COUNT(*) INTO current_streak
    FROM (
        SELECT is_win
        FROM ordered_matches
        WHERE is_win = true
        AND NOT EXISTS (
            SELECT 1
            FROM ordered_matches om2
            WHERE om2.is_win = false
            AND om2.created_at > ordered_matches.created_at
        )
    ) streak;

    -- Calculeaza procentul de castiguri cu 2 zecimale
    IF total_count > 0 THEN
        win_rate_calc := ROUND((wins_count::NUMERIC / total_count::NUMERIC * 100)::NUMERIC, 2);
    ELSE
        win_rate_calc := 0;
    END IF;

    -- Obtine nivelul curent
    SELECT px.current_level INTO player_level
    FROM player_xp px
    WHERE px.user_id = player_uuid;

    -- Daca nu se gaseste nivel, seteaza la 1
    IF player_level IS NULL THEN
        player_level := 1;
    END IF;

    -- Insereaza sau actualizeaza stats-urile player-ului
    INSERT INTO player_stats (
        user_id,
        current_level,
        total_matches,
        won_matches,
        win_rate,
        current_streak,
        updated_at
    )
    VALUES (
        player_uuid,
        player_level,
        total_count,
        wins_count,
        win_rate_calc,
        COALESCE(current_streak, 0),
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_level = EXCLUDED.current_level,
        total_matches = EXCLUDED.total_matches,
        won_matches = EXCLUDED.won_matches,
        win_rate = EXCLUDED.win_rate,
        current_streak = EXCLUDED.current_streak,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Recalculeaza stats pentru toate user-ii care au jucat meciuri
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Obtine toate user-ii care au jucat meciuri
    FOR user_record IN 
        SELECT DISTINCT 
            CASE 
                WHEN player1_id = winner_id THEN player1_id
                WHEN player2_id = winner_id THEN player2_id
                ELSE player1_id
            END as user_id
        FROM matches
        WHERE status = 'completed'
    LOOP
        -- Calculeaza stats pentru fiecare user
        PERFORM calculate_player_stats(user_record.user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
