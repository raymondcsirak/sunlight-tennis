-- Drop existing RLS policies for xp_history
DROP POLICY IF EXISTS "Users can view their own XP history" ON xp_history;
DROP POLICY IF EXISTS "Users can insert their own XP history" ON xp_history;
DROP POLICY IF EXISTS "Service role can insert XP history" ON xp_history;

-- Create new RLS policies
CREATE POLICY "Users can view their own XP history"
    ON xp_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage XP history"
    ON xp_history
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
