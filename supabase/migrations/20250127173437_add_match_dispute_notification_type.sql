-- Add match_dispute to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'match_dispute';
