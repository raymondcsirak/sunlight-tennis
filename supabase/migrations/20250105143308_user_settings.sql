-- Stergere tabel daca exista
DROP TABLE IF EXISTS user_settings CASCADE;

-- Creare tabel user_settings
CREATE TABLE user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    match_reminders BOOLEAN DEFAULT true,
    court_updates BOOLEAN DEFAULT true,
    privacy_profile_visible BOOLEAN DEFAULT true,
    privacy_skill_visible BOOLEAN DEFAULT true,
    privacy_history_visible BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'system',
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Activare RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Creare politici RLS
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Creare trigger pentru actualizare updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
