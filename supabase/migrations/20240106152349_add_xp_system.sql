-- Sistem de experienta si progres
-- Implementeaza:
-- - Tabelul pentru XP si nivel jucatori
-- - Sistem de calcul XP pentru diverse activitati
-- - Istoric XP cu sursa si timestamp
-- - Actualizare automata nivel bazat pe XP

-- Sterge tabelele existente daca exista
DROP TABLE IF EXISTS xp_history CASCADE;
DROP TABLE IF EXISTS xp_multipliers CASCADE;
DROP TABLE IF EXISTS player_xp CASCADE;

-- Creeaza tabelul player_xp
CREATE TABLE player_xp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_xp INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Creeaza tabelul xp_history pentru urmarirea castigurilor de XP
CREATE TABLE xp_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creeaza tabelul xp_multipliers pentru activitati diferite
CREATE TABLE xp_multipliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type TEXT NOT NULL UNIQUE,
    multiplier FLOAT NOT NULL DEFAULT 1.0,
    base_xp INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adauga politici RLS
ALTER TABLE player_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_multipliers ENABLE ROW LEVEL SECURITY;

-- Politici pentru player_xp
CREATE POLICY "Users can view their own XP"
    ON player_xp FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP"
    ON player_xp FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politici pentru xp_history
CREATE POLICY "Users can view their own XP history"
    ON xp_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP history"
    ON xp_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Politici pentru xp_multipliers (doar pentru citire pentru useri)
CREATE POLICY "Users can view XP multipliers"
    ON xp_multipliers FOR SELECT
    TO authenticated
    USING (true);

-- Creeaza trigger-uri pentru updated_at
CREATE TRIGGER update_player_xp_updated_at
    BEFORE UPDATE ON player_xp
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_xp_multipliers_updated_at
    BEFORE UPDATE ON xp_multipliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insereaza multiplicatori de XP default
INSERT INTO xp_multipliers (activity_type, multiplier, base_xp, description) VALUES
    ('login', 1.0, 50, 'Daily login'),
    ('court_booking', 1.0, 50, 'Court booking'),
    ('training_session', 1.5, 100, 'Training session booking'),
    ('match_won', 2.0, 200, 'Match victory'),
    ('match_played', 1.0, 50, 'Match participation'),
    ('partner_request', 1.0, 50, 'Partner finder request');

-- Functie pentru calcularea XP necesar pentru urmatorul nivel
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_number INTEGER)
RETURNS INTEGER AS $$
BEGIN
    
    RETURN FLOOR(1000 * POWER(1.2, level_number - 1));
END;
$$ LANGUAGE plpgsql; 