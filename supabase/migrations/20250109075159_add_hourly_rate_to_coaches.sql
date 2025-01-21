-- Adaugare coloana hourly_rate in tabelul coaches
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS hourly_rate INTEGER DEFAULT 50;

-- Actualizare tuturor antrenorilor existenti cu valoarea default de 50 lei pe ora
UPDATE coaches
SET hourly_rate = 50
WHERE hourly_rate IS NULL;