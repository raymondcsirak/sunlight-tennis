-- Modify win_rate column to use NUMERIC(5,2) for percentages
ALTER TABLE player_stats
ALTER COLUMN win_rate TYPE NUMERIC(5,2);

-- Update the calculate_player_stats function to round win rate to 2 decimal places
CREATE OR REPLACE FUNCTION calculate_player_stats(player_uuid UUID)
RETURNS void AS $$
DECLARE
    total_count INTEGER;
    wins_count INTEGER;
    win_rate_calc NUMERIC(5,2);
    player_level INTEGER;
BEGIN
    -- Get total matches and wins
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE winner_id = player_uuid) as wins
    INTO total_count, wins_count
    FROM matches
    WHERE (player1_id = player_uuid OR player2_id = player_uuid)
        AND winner_id IS NOT NULL;

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
        updated_at
    )
    VALUES (
        player_uuid,
        player_level,
        total_count,
        wins_count,
        win_rate_calc,
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_level = EXCLUDED.current_level,
        total_matches = EXCLUDED.total_matches,
        won_matches = EXCLUDED.won_matches,
        win_rate = EXCLUDED.win_rate,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;
