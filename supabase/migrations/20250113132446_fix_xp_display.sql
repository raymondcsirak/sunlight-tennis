-- Actualizeaza functia de calculare XP pentru a gestiona nivelul maxim
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_number INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- XP de baza: 1000, creste cu 5% la fiecare nivel
    RETURN FLOOR(1000 * POWER(1.05, level_number - 1));
END;
$$ LANGUAGE plpgsql;

-- Actualizeaza functia de calculare nivel
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

-- Recalculeaza nivelurile pentru toate player-ii
UPDATE player_xp
SET current_level = calculate_player_level(current_xp);