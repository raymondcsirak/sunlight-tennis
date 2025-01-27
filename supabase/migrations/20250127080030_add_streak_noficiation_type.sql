-- Adaugare nou tip de notificare in enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'streak_broken'; 