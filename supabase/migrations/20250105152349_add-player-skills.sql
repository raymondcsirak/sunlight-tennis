-- Stergere tabel daca exista
DROP TABLE IF EXISTS player_skills CASCADE;

-- Creare tabel player_skills
CREATE TABLE player_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_type TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_type)
);

-- Activare RLS
ALTER TABLE player_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skills"
    ON player_skills
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
    ON player_skills
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
    ON player_skills
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Creare trigger pentru actualizare updated_at
CREATE TRIGGER update_player_skills_updated_at
    BEFORE UPDATE ON player_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserare tipuri de abilitati default
INSERT INTO player_skills (user_id, skill_type, level)
SELECT 
    auth.uid(),
    skill_type,
    1
FROM 
    unnest(ARRAY[
        'Forehand',
        'Backhand',
        'Serve',
        'Volley',
        'Footwork',
        'Mental Game'
    ]) AS skill_type
WHERE 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
ON CONFLICT (user_id, skill_type) DO NOTHING; 