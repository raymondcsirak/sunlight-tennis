-- Update the XP calculation function
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_number INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Base XP: 1000, increases by 5% each level
    RETURN FLOOR(1000 * POWER(1.05, level_number - 1));
END;
$$ LANGUAGE plpgsql; 