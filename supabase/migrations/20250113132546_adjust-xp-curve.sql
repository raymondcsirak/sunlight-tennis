-- Update the XP calculation function to use steeper curve
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_number INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Base XP: 1000, doubles each level
    RETURN FLOOR(1000 * POWER(2.0, level_number - 1));
END;
$$ LANGUAGE plpgsql;

-- Update the level calculation function
CREATE OR REPLACE FUNCTION calculate_player_level(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_level INTEGER := 1;
    next_level_xp INTEGER;
BEGIN
    LOOP
        next_level_xp := calculate_xp_for_level(current_level + 1);
        EXIT WHEN xp < next_level_xp OR current_level >= 99;
        current_level := current_level + 1;
    END LOOP;
    RETURN current_level;
END;
$$ LANGUAGE plpgsql;

-- Recalculate levels for all players
UPDATE player_xp
SET current_level = calculate_player_level(current_xp);
