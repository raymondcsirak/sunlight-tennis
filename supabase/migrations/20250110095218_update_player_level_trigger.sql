-- Functie pentru calcul nivel in functie de XP
CREATE OR REPLACE FUNCTION calculate_player_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Folosind aceleasi praguri ca in frontend
    IF xp >= 10000 THEN RETURN 5;
    ELSIF xp >= 5000 THEN RETURN 4;
    ELSIF xp >= 2500 THEN RETURN 3;
    ELSIF xp >= 1000 THEN RETURN 2;
    ELSE RETURN 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Functie pentru actualizare nivel in functie de XP
CREATE OR REPLACE FUNCTION update_player_level()
RETURNS TRIGGER AS $$
DECLARE
    new_level INTEGER;
BEGIN
    -- Calculare nivel nou in functie de XP nou
    new_level := calculate_player_level(NEW.current_xp);
    
    -- Daca nivelul a fost schimbat, actualizare
    IF new_level != OLD.current_level THEN
        NEW.current_level := new_level;
        
        -- Inserare notificare pentru nivel up
        IF new_level > OLD.current_level THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data
            ) VALUES (
                NEW.user_id,
                'level_up',
                'Level Up!',
                format('Congratulations! You have reached level %s!', new_level),
                jsonb_build_object(
                    'old_level', OLD.current_level,
                    'new_level', new_level,
                    'current_xp', NEW.current_xp
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Stergere trigger daca exista
DROP TRIGGER IF EXISTS update_player_level_trigger ON player_xp;

-- Creare trigger
CREATE TRIGGER update_player_level_trigger
    BEFORE UPDATE OF current_xp ON player_xp
    FOR EACH ROW
    EXECUTE FUNCTION update_player_level();

-- Actualizare niveluri tuturor jucatorilor existenti
UPDATE player_xp
SET current_level = calculate_player_level(current_xp)
WHERE TRUE;