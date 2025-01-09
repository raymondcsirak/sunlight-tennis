-- Drop existing constraints and columns if they exist
ALTER TABLE training_sessions
DROP CONSTRAINT IF EXISTS training_sessions_student_id_fkey;

-- Add student_id column with proper reference to auth.users
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES auth.users(id);

-- Enable realtime for training_sessions if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'training_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE training_sessions;
  END IF;
END
$$;

-- Add policy for realtime
ALTER TABLE training_sessions REPLICA IDENTITY FULL; 