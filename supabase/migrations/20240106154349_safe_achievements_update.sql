-- Creare tip enum pentru tipuri de realizari daca nu exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_type') THEN
        CREATE TYPE achievement_type AS ENUM (
            'first_match',
            'streak_7',
            'matches_10',
            'level_10'
        );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Creare tabel realizari daca nu exista
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type achievement_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, type)
);

-- Activare RLS daca nu este deja activata
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = current_schema()
        AND c.relname = 'achievements'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Creare politici (ele vor da eroare daca exista deja, ceea ce este bine)
DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "Users can view their own achievements"
            ON achievements FOR SELECT
            USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;

    BEGIN
        CREATE POLICY "Users can insert their own achievements"
            ON achievements FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Creare trigger (va da eroare daca exista deja, ceea ce este bine)
DO $$
BEGIN
    CREATE TRIGGER update_achievements_updated_at
        BEFORE UPDATE ON achievements
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- Creare sau inlocuire functie de obtinere detalii realizari
CREATE OR REPLACE FUNCTION get_achievement_details(achievement_type achievement_type)
RETURNS TABLE (name TEXT, description TEXT) AS $$
BEGIN
    RETURN QUERY SELECT
        CASE achievement_type
            WHEN 'first_match' THEN 'First Match'
            WHEN 'streak_7' THEN 'Week Warrior'
            WHEN 'matches_10' THEN 'Match Master'
            WHEN 'level_10' THEN 'Rising Star'
        END,
        CASE achievement_type
            WHEN 'first_match' THEN 'Played your first tennis match'
            WHEN 'streak_7' THEN 'Maintained a 7-day activity streak'
            WHEN 'matches_10' THEN 'Played 10 matches'
            WHEN 'level_10' THEN 'Reached level 10'
        END;
END;
$$ LANGUAGE plpgsql; 