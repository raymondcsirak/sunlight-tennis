-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read all player stats" ON player_stats;
DROP POLICY IF EXISTS "Allow system functions to update player stats" ON player_stats;

-- Create policy for reading player stats (allow all authenticated users to read any player's stats)
CREATE POLICY "Allow users to read all player stats" ON player_stats
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy for system functions to update player stats
CREATE POLICY "Allow system functions to update player stats" ON player_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON player_stats TO postgres, authenticated;
GRANT USAGE ON SCHEMA public TO postgres, authenticated;

-- Ensure the trigger function has the right security context
ALTER FUNCTION calculate_player_stats(UUID) SECURITY DEFINER;
ALTER FUNCTION update_player_stats_on_match_change() SECURITY DEFINER;
