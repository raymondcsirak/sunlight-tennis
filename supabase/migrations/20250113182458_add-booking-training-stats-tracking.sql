-- Update calculate_player_stats function to include bookings and trainings
CREATE OR REPLACE FUNCTION calculate_player_stats(player_uuid UUID)
RETURNS void AS $$
DECLARE
    total_count INTEGER;
    wins_count INTEGER;
    win_rate_calc NUMERIC(5,2);
    player_level INTEGER;
    current_streak INTEGER;
    booking_count INTEGER;
    training_count INTEGER;
BEGIN
    -- Get total matches and wins (existing code)
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE winner_id = player_uuid) as wins
    INTO total_count, wins_count
    FROM matches
    WHERE (player1_id = player_uuid OR player2_id = player_uuid)
        AND status = 'completed';

    -- Get booking count
    SELECT COUNT(*) INTO booking_count
    FROM court_bookings
    WHERE user_id = player_uuid;

    -- Get training count
    SELECT COUNT(*) INTO training_count
    FROM training_sessions
    WHERE user_id = player_uuid;

    -- Calculate current streak (existing code)
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

    -- Get current level (existing code)
    SELECT current_level INTO player_level
    FROM player_xp
    WHERE user_id = player_uuid;

    -- If no level found, default to 1
    IF player_level IS NULL THEN
        player_level := 1;
    END IF;

    -- Calculate win rate (existing code)
    IF total_count > 0 THEN
        win_rate_calc := ROUND((wins_count::NUMERIC / total_count::NUMERIC * 100)::NUMERIC, 2);
    ELSE
        win_rate_calc := 0;
    END IF;

    -- Insert or update player stats
    INSERT INTO player_stats (
        user_id,
        current_level,
        total_matches,
        won_matches,
        win_rate,
        current_streak,
        total_bookings,
        total_trainings,
        updated_at
    )
    VALUES (
        player_uuid,
        player_level,
        total_count,
        wins_count,
        win_rate_calc,
        COALESCE(current_streak, 0),
        booking_count,
        training_count,
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_level = EXCLUDED.current_level,
        total_matches = EXCLUDED.total_matches,
        won_matches = EXCLUDED.won_matches,
        win_rate = EXCLUDED.win_rate,
        current_streak = EXCLUDED.current_streak,
        total_bookings = EXCLUDED.total_bookings,
        total_trainings = EXCLUDED.total_trainings,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger functions for bookings and trainings
CREATE OR REPLACE FUNCTION update_player_stats_on_booking_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_player_stats(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_player_stats_on_training_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_player_stats(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS booking_stats_update ON court_bookings;
CREATE TRIGGER booking_stats_update
    AFTER INSERT OR DELETE
    ON court_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats_on_booking_change();

DROP TRIGGER IF EXISTS training_stats_update ON training_sessions;
CREATE TRIGGER training_stats_update
    AFTER INSERT OR DELETE
    ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats_on_training_change();

-- Recalculate stats for all users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM (
            SELECT user_id FROM court_bookings
            UNION
            SELECT user_id FROM training_sessions
            UNION
            SELECT player1_id as user_id FROM matches WHERE status = 'completed'
            UNION
            SELECT player2_id as user_id FROM matches WHERE status = 'completed'
        ) all_users
    LOOP
        PERFORM calculate_player_stats(user_record.user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
