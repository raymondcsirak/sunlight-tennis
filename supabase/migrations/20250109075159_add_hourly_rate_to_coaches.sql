-- Add hourly_rate column to coaches table
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS hourly_rate INTEGER DEFAULT 50;

-- Update all existing coaches to have 50 lei hourly rate
UPDATE coaches
SET hourly_rate = 50
WHERE hourly_rate IS NULL;
