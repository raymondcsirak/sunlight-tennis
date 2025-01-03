-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables and types if they exist
DROP TABLE IF EXISTS login_streaks CASCADE;
DROP TABLE IF EXISTS xp_history CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS player_experience CASCADE;
DROP TABLE IF EXISTS player_skills CASCADE;
DROP TYPE IF EXISTS achievement_type CASCADE;
DROP TYPE IF EXISTS skill_level CASCADE;

-- Player Skills
CREATE TYPE skill_level AS ENUM ('1', '2', '3', '4', '5');

CREATE TABLE player_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  forehand_level skill_level DEFAULT '1',
  backhand_level skill_level DEFAULT '1',
  serve_level skill_level DEFAULT '1',
  last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Player Experience
CREATE TABLE player_experience (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT valid_xp CHECK (total_xp >= 0),
  CONSTRAINT valid_level CHECK (current_level >= 1)
);

-- Achievements
CREATE TYPE achievement_type AS ENUM (
  'WELCOME', 'DEDICATION', 'VICTORY', 'STREAK', 'TOURNAMENT', 'BOOKING', 'TRAINING'
);

CREATE TABLE achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type achievement_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- XP History for tracking XP gains
CREATE TABLE xp_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT positive_xp CHECK (amount > 0)
);

-- Login Streaks for tracking consecutive logins
CREATE TABLE login_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT valid_streak CHECK (current_streak >= 0 AND longest_streak >= 0)
);

-- Enable RLS
ALTER TABLE player_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own skills"
  ON player_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON player_skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own experience"
  ON player_experience FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can update experience"
  ON player_experience FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own XP history"
  ON xp_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own login streaks"
  ON login_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_player_skills_updated_at
  BEFORE UPDATE ON player_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_player_experience_updated_at
  BEFORE UPDATE ON player_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_login_streaks_updated_at
  BEFORE UPDATE ON login_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at(); 