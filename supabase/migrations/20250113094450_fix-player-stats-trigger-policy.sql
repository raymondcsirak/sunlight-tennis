-- Sterge politici existente
DROP POLICY IF EXISTS "Allow users to read all player stats" ON player_stats;
DROP POLICY IF EXISTS "Allow system functions to update player stats" ON player_stats;

-- Creacre politica pentru citirea stats-urilor jucatorilor (permite acces tuturor jucatorilor pentru toate user-ii autentificati)
CREATE POLICY "Allow users to read all player stats" ON player_stats
    FOR SELECT
    TO authenticated
    USING (true);

-- Creeaza politica pentru functii sistem pentru actualizarea stats-urilor jucatorilor
CREATE POLICY "Allow system functions to update player stats" ON player_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Asigura ca RLS este activ
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Permite acces doar pentru useri autentificati
GRANT ALL ON player_stats TO postgres, authenticated;
GRANT USAGE ON SCHEMA public TO postgres, authenticated;

-- Asigura ca functia trigger are contextul de securitate corect
ALTER FUNCTION calculate_player_stats(UUID) SECURITY DEFINER;
ALTER FUNCTION update_player_stats_on_match_change() SECURITY DEFINER;
