-- Add new notification type to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'match_request_response';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'match_request_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'match_request_rejected';