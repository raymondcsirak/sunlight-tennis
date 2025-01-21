-- Creare tip enum pentru tipuri de activitati daca nu exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM (
            'login',
            'court_booking',
            'training_session',
            'match_won',
            'match_played',
            'partner_request'
        );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Creare tabel xp_history daca nu exista
CREATE TABLE IF NOT EXISTS player_xp (
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

-- Creare tabel xp_history daca nu exista
CREATE TABLE IF NOT EXISTS xp_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    activity_type activity_type NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creare tabel xp_multipliers daca nu exista
CREATE TABLE IF NOT EXISTS xp_multipliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type activity_type NOT NULL UNIQUE,
    multiplier FLOAT NOT NULL DEFAULT 1.0,
    base_xp INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activare RLS daca nu este deja activata
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = current_schema() AND c.relname = 'player_xp' AND c.relrowsecurity = true) THEN
        ALTER TABLE player_xp ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = current_schema() AND c.relname = 'xp_history' AND c.relrowsecurity = true) THEN
        ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = current_schema() AND c.relname = 'xp_multipliers' AND c.relrowsecurity = true) THEN
        ALTER TABLE xp_multipliers ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Creare politici
DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "Users can view their own XP"
            ON player_xp FOR SELECT
            USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Users can update their own XP"
            ON player_xp FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Users can view their own XP history"
            ON xp_history FOR SELECT
            USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Users can insert their own XP history"
            ON xp_history FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Users can view XP multipliers"
            ON xp_multipliers FOR SELECT
            TO authenticated
            USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Creare trigger-uri
DO $$
BEGIN
    BEGIN
        CREATE TRIGGER update_player_xp_updated_at
            BEFORE UPDATE ON player_xp
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE TRIGGER update_xp_multipliers_updated_at
            BEFORE UPDATE ON xp_multipliers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Creare sau inlocuire functie de obtinere detalii XP
CREATE OR REPLACE FUNCTION get_xp_multiplier_details(activity activity_type)
RETURNS TABLE (multiplier FLOAT, base_xp INTEGER, description TEXT) AS $$
BEGIN
    RETURN QUERY SELECT
        CASE activity
            WHEN 'login' THEN 1.0
            WHEN 'court_booking' THEN 1.0
            WHEN 'training_session' THEN 1.5
            WHEN 'match_won' THEN 2.0
            WHEN 'match_played' THEN 1.0
            WHEN 'partner_request' THEN 1.0
        END,
        CASE activity
            WHEN 'login' THEN 50
            WHEN 'court_booking' THEN 50
            WHEN 'training_session' THEN 100
            WHEN 'match_won' THEN 200
            WHEN 'match_played' THEN 50
            WHEN 'partner_request' THEN 50
        END,
        CASE activity
            WHEN 'login' THEN 'Daily login'
            WHEN 'court_booking' THEN 'Court booking'
            WHEN 'training_session' THEN 'Training session booking'
            WHEN 'match_won' THEN 'Match victory'
            WHEN 'match_played' THEN 'Match participation'
            WHEN 'partner_request' THEN 'Partner finder request'
        END;
END;
$$ LANGUAGE plpgsql;

-- Creare sau inlocuire functie de calcul XP
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_number INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- XP de baza: 1000, creste cu 5% la fiecare nivel
    RETURN FLOOR(1000 * POWER(1.05, level_number - 1));
END;
$$ LANGUAGE plpgsql; 