-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;

-- Update RLS policies to allow users to update their own username
CREATE POLICY "Users can update their own username" 
ON profiles 
FOR UPDATE TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Adauga un comentariu pentru a descrie coloana
COMMENT ON COLUMN profiles.username IS 'Unique username for the user. Can be used for @mentions and profile URLs.';
