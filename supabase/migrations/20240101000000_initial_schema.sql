-- Schema initiala pentru aplicatia Sunlight Tennis
-- Contine structura de baza pentru:
-- - Profile utilizatori
-- - Sistem de notificari
-- - Configurari de baza
-- - Politici de securitate (RLS)

-- Activam extensiile necesare
create extension if not exists "vector" with schema "public";
create extension if not exists "pg_net" with schema "public";

-- Creeaza extensiile necesare
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Creeaza functii pentru trigger-uri
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Creeaza tipuri de enum
CREATE TYPE user_status AS ENUM ('online', 'playing', 'away');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE surface_type AS ENUM ('clay', 'hard', 'grass', 'artificial');

-- Creeaza tabelul profiles (extinde auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 10),
    avatar_url TEXT,
    status user_status DEFAULT 'online',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Creeaza tabelul user_settings
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

-- Creeaza trigger pentru user_settings updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Creeaza tabelul courts
CREATE TABLE courts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    surface surface_type NOT NULL,
    is_indoor BOOLEAN DEFAULT false,
    hourly_rate DECIMAL(10,2) NOT NULL,
    location GEOMETRY(Point, 4326),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    image_url TEXT
);

-- Creeaza tabelul bookings
CREATE TABLE bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    court_id UUID REFERENCES courts(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

    CONSTRAINT no_overlapping_bookings
        EXCLUDE USING gist (
            court_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        )
);

-- Creeaza tabelul matches
CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) NOT NULL,
    player1_id UUID REFERENCES auth.users(id) NOT NULL,
    player2_id UUID REFERENCES auth.users(id) NOT NULL,
    score TEXT,
    status match_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Creeaza tabelul achievements
CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Creeaza tabelul player_experience
CREATE TABLE player_experience (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Creeaza trigger pentru player_experience updated_at
CREATE TRIGGER update_player_experience_updated_at
    BEFORE UPDATE ON player_experience
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activeaza RLS pentru toate tabelele
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Creeaza politici RLS

-- Politica pentru profiles: vizibile pentru toată lumea, dar doar editabile de către proprietar
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Courts: vizibile pentru toată lumea, dar doar administrabile de către admin
CREATE POLICY "Courts are viewable by everyone"
    ON courts FOR SELECT
    USING (true);

-- Politica pentru bookings: user-ii pot vedea propriile rezervari si pot crea noi rezervari
CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
    ON bookings FOR UPDATE
    USING (auth.uid() = user_id);

-- Politica pentru matches: participantii pot vedea si actualiza propriile meciuri
CREATE POLICY "Match participants can view their matches"
    ON matches FOR SELECT
    USING (auth.uid() IN (player1_id, player2_id));

CREATE POLICY "Match participants can update their matches"
    ON matches FOR UPDATE
    USING (auth.uid() IN (player1_id, player2_id));

-- Achievements: vizibile pentru toată lumea, dar doar sistemul poate crea
CREATE POLICY "Achievements are viewable by everyone"
    ON achievements FOR SELECT
    USING (true);

-- Player Experience: user-ii pot vedea propriul lor XP, sistemul poate actualiza
CREATE POLICY "Users can view own experience"
    ON player_experience FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can update experience"
    ON player_experience FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- User Settings: user-ii pot vedea si actualiza propriile setari
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Creeaza bucket-ul de storage pentru avatar-uri
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Creeaza politici de storage pentru bucket-ul de avatar-uri
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Creeaza trigger-uri pentru updated_at la toate tabelele
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courts_updated_at
    BEFORE UPDATE ON courts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 