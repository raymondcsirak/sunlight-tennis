-- Adaugam tipul de notificare pentru dispute de meci
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'match_dispute';
