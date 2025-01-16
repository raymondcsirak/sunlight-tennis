-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can create their own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can update their own training sessions" ON training_sessions;

-- Create new policies
CREATE POLICY "Anyone can view confirmed training sessions"
    ON training_sessions FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own training sessions"
    ON training_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training sessions"
    ON training_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

