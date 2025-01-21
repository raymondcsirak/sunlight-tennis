-- Creare tip enum pentru tipuri de notificari daca nu exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'match_scheduled',
            'training_reminder',
            'xp_gained',
            'level_up',
            'achievement_unlocked',
            'court_booked',
            'training_booked',
            'partner_request'
        );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Creare tabel notificari daca nu exista
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT notifications_user_id_type_key UNIQUE(user_id, id)
);

-- Activare RLS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = current_schema()
        AND c.relname = 'notifications'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Creare politici RLS
DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "Users can view their own notifications"
            ON notifications FOR SELECT
            USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Users can update their own notifications"
            ON notifications FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Creare trigger pentru actualizare updated_at
DO $$
BEGIN
    CREATE TRIGGER update_notifications_updated_at
        BEFORE UPDATE ON notifications
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Functie de creare notificare
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'::jsonb
) RETURNS notifications AS $$
DECLARE
    v_notification notifications;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING * INTO v_notification;
    
    RETURN v_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 