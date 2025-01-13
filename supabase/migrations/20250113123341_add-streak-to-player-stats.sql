-- Add current_streak column to player_stats
ALTER TABLE player_stats
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- Update calculate_player_stats function to include streak calculation
CREATE OR REPLACE FUNCTION calculate_player_stats(player_uuid UUID)
RETURNS void AS $$
DECLARE
    total_count INTEGER;
    wins_count INTEGER;
    win_rate_calc NUMERIC(5,2);
    player_level INTEGER;
    current_streak INTEGER;
BEGIN
    -- Get total matches and wins with a more inclusive query
    WITH match_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE winner_id = player_uuid) as wins
        FROM matches
        WHERE (player1_id = player_uuid OR player2_id = player_uuid)
            AND status = 'completed'
    )
    SELECT total, wins INTO total_count, wins_count FROM match_stats;

    -- Calculate current streak
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
        AND created_at >= (
            SELECT created_at
            FROM ordered_matches
            WHERE is_win = false
            LIMIT 1
        )
    ) streak;

    -- Calculate win rate with 2 decimal places
    IF total_count > 0 THEN
        win_rate_calc := ROUND((wins_count::NUMERIC / total_count::NUMERIC * 100)::NUMERIC, 2);
    ELSE
        win_rate_calc := 0;
    END IF;

    -- Get current level
    SELECT px.current_level INTO player_level
    FROM player_xp px
    WHERE px.user_id = player_uuid;

    -- If no level found, default to 1
    IF player_level IS NULL THEN
        player_level := 1;
    END IF;

    -- Insert or update player stats
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

-- Recalculate stats for all users to update streaks
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT 
            CASE 
                WHEN player1_id = winner_id THEN player1_id
                WHEN player2_id = winner_id THEN player2_id
                ELSE COALESCE(player1_id, player2_id)
            END as user_id
        FROM matches
        WHERE status = 'completed'
    LOOP
        PERFORM calculate_player_stats(user_record.user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
