-- Create the player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    current_level INTEGER NOT NULL DEFAULT 1,
    total_matches INTEGER NOT NULL DEFAULT 0,
    won_matches INTEGER NOT NULL DEFAULT 0,
    win_rate DECIMAL NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT win_rate_range CHECK (win_rate >= 0 AND win_rate <= 100)
);

-- Create function to calculate player stats
CREATE OR REPLACE FUNCTION calculate_player_stats(player_uuid UUID)
RETURNS void AS $$
DECLARE
    total_count INTEGER;
    wins_count INTEGER;
    win_rate_calc DECIMAL;
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

    -- Calculate win rate
    IF total_count > 0 THEN
        win_rate_calc := (wins_count::DECIMAL / total_count::DECIMAL) * 100;
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

-- Create trigger function for player_xp updates
CREATE OR REPLACE FUNCTION update_player_stats_on_xp_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if current_level changed
    IF OLD.current_level IS NULL OR NEW.current_level != OLD.current_level THEN
        PERFORM calculate_player_stats(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for match updates
CREATE OR REPLACE FUNCTION update_player_stats_on_match_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If winner is set or changed
    IF (OLD.winner_id IS NULL AND NEW.winner_id IS NOT NULL) OR 
       (OLD.winner_id IS NOT NULL AND NEW.winner_id != OLD.winner_id) THEN
        -- Update stats for both players
        PERFORM calculate_player_stats(NEW.player1_id);
        PERFORM calculate_player_stats(NEW.player2_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS player_xp_stats_update ON player_xp;
CREATE TRIGGER player_xp_stats_update
    AFTER INSERT OR UPDATE OF current_level
    ON player_xp
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats_on_xp_change();

DROP TRIGGER IF EXISTS match_stats_update ON matches;
CREATE TRIGGER match_stats_update
    AFTER INSERT OR UPDATE OF winner_id
    ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats_on_match_change();

-- Populate initial data
DO $$
DECLARE
    player_id UUID;
BEGIN
    FOR player_id IN 
        SELECT DISTINCT user_id 
        FROM player_xp
    LOOP
        PERFORM calculate_player_stats(player_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
