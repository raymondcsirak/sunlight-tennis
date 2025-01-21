-- Sterge politici existente
DROP POLICY IF EXISTS "Allow users to read all player stats" ON player_stats;
DROP POLICY IF EXISTS "Allow system functions to update player stats" ON player_stats;

-- Creeaza politica pentru citirea stats-urilor jucatorilor (permite acces tuturor jucatorilor pentru toate user-ii autentificati)
CREATE POLICY "Allow users to read all player stats" ON player_stats
    FOR SELECT
    TO authenticated
    USING (true);

-- Creeaza politica pentru functii sistem pentru actualizarea stats-urilor jucatorilor
CREATE POLICY "Allow system functions to update player stats" ON player_stats
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- Asigura ca public nu poate accesa tabelul
REVOKE ALL ON player_stats FROM public;

-- Permite acces doar pentru useri autentificati
GRANT SELECT ON player_stats TO authenticated;
