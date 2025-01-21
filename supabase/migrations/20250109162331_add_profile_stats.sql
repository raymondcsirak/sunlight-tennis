-- Adaugare coloane level si matches_won in tabelul profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 5),
ADD COLUMN IF NOT EXISTS matches_won INTEGER DEFAULT 0 CHECK (matches_won >= 0);

-- Actualizare randuri existente cu valori default
UPDATE profiles 
SET 
  level = 1,
  matches_won = 0
WHERE level IS NULL OR matches_won IS NULL;