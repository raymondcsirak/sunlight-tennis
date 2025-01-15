-- Create message_threads table
CREATE TABLE message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    participant1_id UUID REFERENCES profiles(id) NOT NULL,
    participant2_id UUID REFERENCES profiles(id) NOT NULL,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_preview TEXT,
    match_ids UUID[] DEFAULT ARRAY[]::UUID[],
    CONSTRAINT different_participants CHECK (participant1_id != participant2_id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    is_system_message BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_message_threads_participants ON message_threads(participant1_id, participant2_id);
CREATE INDEX idx_message_threads_updated ON message_threads(updated_at DESC);
CREATE INDEX idx_messages_thread_created ON messages(thread_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Enable RLS
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_threads

-- Users can view threads they're part of
CREATE POLICY "Users can view their threads"
    ON message_threads FOR SELECT
    USING (
        auth.uid() = participant1_id OR 
        auth.uid() = participant2_id
    );

-- System can create threads (for match acceptance)
CREATE POLICY "System can create threads"
    ON message_threads FOR INSERT
    WITH CHECK (true);

-- Users can update their thread's last_message info
CREATE POLICY "Users can update their threads"
    ON message_threads FOR UPDATE
    USING (
        auth.uid() = participant1_id OR 
        auth.uid() = participant2_id
    )
    WITH CHECK (
        auth.uid() = participant1_id OR 
        auth.uid() = participant2_id
    );

-- RLS Policies for messages

-- Users can view messages in their threads
CREATE POLICY "Users can view messages in their threads"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM message_threads
            WHERE message_threads.id = messages.thread_id
            AND (
                auth.uid() = message_threads.participant1_id OR 
                auth.uid() = message_threads.participant2_id
            )
        )
    );

-- Users can send messages to their threads
CREATE POLICY "Users can send messages to their threads"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM message_threads
            WHERE message_threads.id = messages.thread_id
            AND (
                auth.uid() = message_threads.participant1_id OR 
                auth.uid() = message_threads.participant2_id
            )
        )
        AND auth.uid() = sender_id
    );

-- Users can update read status of messages in their threads
CREATE POLICY "Users can update message read status"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM message_threads
            WHERE message_threads.id = messages.thread_id
            AND (
                auth.uid() = message_threads.participant1_id OR 
                auth.uid() = message_threads.participant2_id
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM message_threads
            WHERE message_threads.id = messages.thread_id
            AND (
                auth.uid() = message_threads.participant1_id OR 
                auth.uid() = message_threads.participant2_id
            )
        )
    );

-- System can create system messages
CREATE POLICY "System can create system messages"
    ON messages FOR INSERT
    WITH CHECK (is_system_message = true);

-- Enable realtime for both tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'message_threads'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE message_threads;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
END
$$;

-- Add REPLICA IDENTITY FULL for better realtime support
ALTER TABLE message_threads REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Function to update thread's last_message info
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE message_threads
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = CASE 
            WHEN NEW.is_system_message THEN 'System notification'
            ELSE substring(NEW.content from 1 for 50) || CASE WHEN length(NEW.content) > 50 THEN '...' ELSE '' END
        END,
        updated_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update thread's last_message info
CREATE TRIGGER update_thread_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_last_message();

-- Function to find or create thread between two users
CREATE OR REPLACE FUNCTION find_or_create_thread(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    thread_id UUID;
BEGIN
    -- Try to find existing thread
    SELECT id INTO thread_id
    FROM message_threads
    WHERE 
        (participant1_id = user1_id AND participant2_id = user2_id)
        OR 
        (participant1_id = user2_id AND participant2_id = user1_id)
    LIMIT 1;

    -- If no thread exists, create one
    IF thread_id IS NULL THEN
        INSERT INTO message_threads (participant1_id, participant2_id)
        VALUES (
            LEAST(user1_id, user2_id),
            GREATEST(user1_id, user2_id)
        )
        RETURNING id INTO thread_id;
    END IF;

    RETURN thread_id;
END;
$$ LANGUAGE plpgsql; 