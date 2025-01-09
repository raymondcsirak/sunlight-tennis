-- Add user_id column to training_sessions
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) NOT NULL;
