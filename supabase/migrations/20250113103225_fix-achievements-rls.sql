-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own achievements" ON achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON achievements;

-- Enable RLS for achievements table
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own achievements
CREATE POLICY "Users can view their own achievements"
ON achievements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for the system to insert achievements
CREATE POLICY "System can insert achievements"
ON achievements FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON TABLE achievements TO authenticated;

-- Ensure notification type exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'notification_type' 
    AND typarray <> 0
    AND EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = pg_type.oid 
      AND enumlabel = 'achievement'
    )
  ) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'achievement';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
