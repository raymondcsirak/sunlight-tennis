-- Adaugare coloane lipsa in tabelul coaches
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS specialization TEXT DEFAULT 'Tennis Coach',
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Setare valori default pentru randuri existente
UPDATE coaches
SET 
  is_active = true,
  specialization = 'Tennis Coach'
WHERE specialization IS NULL;
