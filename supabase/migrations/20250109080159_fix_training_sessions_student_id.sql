-- Stergere constrangeri si coloane existente
ALTER TABLE training_sessions
DROP CONSTRAINT IF EXISTS training_sessions_student_id_fkey;

-- Adaugare coloana student_id cu referinta corecta la auth.users
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES auth.users(id);

-- Activare realtime pentru training_sessions daca nu este deja activat
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

-- Adaugare politica pentru realtime
ALTER TABLE training_sessions REPLICA IDENTITY FULL; 