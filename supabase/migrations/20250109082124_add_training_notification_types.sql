-- Adaugare valori noi in enum notification_type
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'training_booked';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'training_scheduled';
