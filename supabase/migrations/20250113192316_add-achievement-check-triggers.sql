-- Creeaza o functie pentru a verifica achievements dupa update-ul stats
CREATE OR REPLACE FUNCTION check_achievements_after_stats_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica achievements doar daca stats relevante au fost schimbate
    IF (
        NEW.total_matches != OLD.total_matches OR
        NEW.won_matches != OLD.won_matches OR
        NEW.total_bookings != OLD.total_bookings OR
        NEW.total_trainings != OLD.total_trainings OR
        NEW.current_streak != OLD.current_streak
    ) THEN
        PERFORM retroactively_award_achievements(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sterge trigger-ul existent daca exista
DROP TRIGGER IF EXISTS check_achievements_on_stats_update ON player_stats;

-- Creeaza trigger pentru a verifica achievements dupa update-ul stats
CREATE TRIGGER check_achievements_on_stats_update
    AFTER UPDATE ON player_stats
    FOR EACH ROW
    EXECUTE FUNCTION check_achievements_after_stats_update();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_achievements_after_stats_update() TO authenticated;
