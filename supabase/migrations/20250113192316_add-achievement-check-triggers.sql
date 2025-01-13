-- Create a function to check achievements after stats update
CREATE OR REPLACE FUNCTION check_achievements_after_stats_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check achievements if relevant stats have changed
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_achievements_on_stats_update ON player_stats;

-- Create trigger to check achievements after stats update
CREATE TRIGGER check_achievements_on_stats_update
    AFTER UPDATE ON player_stats
    FOR EACH ROW
    EXECUTE FUNCTION check_achievements_after_stats_update();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_achievements_after_stats_update() TO authenticated;
