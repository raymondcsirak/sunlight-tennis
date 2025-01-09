-- Add notes column to training_sessions
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS notes TEXT;
