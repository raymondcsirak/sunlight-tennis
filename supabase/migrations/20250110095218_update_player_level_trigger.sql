-- Function to calculate level based on XP
CREATE OR REPLACE FUNCTION calculate_player_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Using the same thresholds as in the frontend
    IF xp >= 10000 THEN RETURN 5;
    ELSIF xp >= 5000 THEN RETURN 4;
    ELSIF xp >= 2500 THEN RETURN 3;
    ELSIF xp >= 1000 THEN RETURN 2;
    ELSE RETURN 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to handle XP updates
CREATE OR REPLACE FUNCTION update_player_level()
RETURNS TRIGGER AS $$
DECLARE
    new_level INTEGER;
BEGIN
    -- Calculate the new level based on the new XP value
    new_level := calculate_player_level(NEW.current_xp);
    
    -- If the level has changed, update it
    IF new_level != OLD.current_level THEN
        NEW.current_level := new_level;
        
        -- Insert a notification for level up
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

-- Create the trigger
DROP TRIGGER IF EXISTS update_player_level_trigger ON player_xp;
CREATE TRIGGER update_player_level_trigger
    BEFORE UPDATE OF current_xp ON player_xp
    FOR EACH ROW
    EXECUTE FUNCTION update_player_level();

-- Update all existing players' levels
UPDATE player_xp
SET current_level = calculate_player_level(current_xp)
WHERE TRUE;
