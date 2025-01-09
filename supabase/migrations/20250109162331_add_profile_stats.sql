-- Add level and matches_won columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 5),
ADD COLUMN IF NOT EXISTS matches_won INTEGER DEFAULT 0 CHECK (matches_won >= 0);

-- Update existing profiles to have default values
UPDATE profiles 
SET 
  level = 1,
  matches_won = 0
WHERE level IS NULL OR matches_won IS NULL;