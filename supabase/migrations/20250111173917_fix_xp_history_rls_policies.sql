-- Sterge politici RLS existente pentru xp_history
DROP POLICY IF EXISTS "Users can view their own XP history" ON xp_history;
DROP POLICY IF EXISTS "Users can insert their own XP history" ON xp_history;
DROP POLICY IF EXISTS "Service role can insert XP history" ON xp_history;

-- Creeaza politici RLS noi
CREATE POLICY "Users can view their own XP history"
    ON xp_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage XP history"
    ON xp_history
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Asigura RLS activ
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
