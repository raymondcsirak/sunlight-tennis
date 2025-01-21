-- Actualizare functie de calcul XP
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_number INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- XP de baza: 1000, creste cu 5% la fiecare nivel
    RETURN FLOOR(1000 * POWER(1.05, level_number - 1));
END;
$$ LANGUAGE plpgsql; 