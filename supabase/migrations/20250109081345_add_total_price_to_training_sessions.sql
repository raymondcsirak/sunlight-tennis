-- Adaugare coloane timestamp
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Adaugare coloana total_price
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS total_price INTEGER;

-- Setare valoare default pentru randuri existente (daca exista)
UPDATE training_sessions
SET total_price = 0
WHERE total_price IS NULL;

-- Stergere trigger existent si creare nou
DROP TRIGGER IF EXISTS set_training_sessions_updated_at ON training_sessions;
CREATE TRIGGER set_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 