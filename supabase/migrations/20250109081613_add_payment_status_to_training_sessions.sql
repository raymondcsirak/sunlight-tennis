-- Adaugare coloana payment_status in tabelul training_sessions
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'pending'::payment_status;