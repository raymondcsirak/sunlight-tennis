-- Adaugare coloana user_id in tabelul training_sessions
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) NOT NULL;