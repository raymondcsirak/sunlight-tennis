-- Add new values to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'training_booked';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'training_scheduled';
