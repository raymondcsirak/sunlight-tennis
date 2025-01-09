-- Add missing columns to coaches table
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS specialization TEXT DEFAULT 'Tennis Coach',
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Set default values for existing records
UPDATE coaches
SET 
  is_active = true,
  specialization = 'Tennis Coach'
WHERE specialization IS NULL;
