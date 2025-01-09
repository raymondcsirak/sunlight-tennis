-- Add coach-related fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_coach BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hourly_rate INTEGER DEFAULT 50, -- Default 50 lei per hour
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update existing profiles that are coaches (if any) with the default hourly rate
UPDATE profiles
SET hourly_rate = 50
WHERE is_coach = true;

-- Add policy to allow reading coach profiles
CREATE POLICY "Anyone can view coach profiles"
ON profiles FOR SELECT
USING (is_coach = true);

-- Add policy to allow coaches to update their own profiles
CREATE POLICY "Coaches can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id AND is_coach = true)
WITH CHECK (auth.uid() = id AND is_coach = true);
