-- Drop existing policies if they exist
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
    TO postgres
    USING (true)
    WITH CHECK (true);

-- Ensure public cannot access the table
REVOKE ALL ON player_stats FROM public;

-- Grant specific permissions to authenticated users
GRANT SELECT ON player_stats TO authenticated;