-- Create enum for response status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE match_response_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create match request responses table
CREATE TABLE IF NOT EXISTS match_request_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES match_requests(id) ON DELETE CASCADE,
    responder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status match_response_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, responder_id)
);

-- Enable RLS
ALTER TABLE match_request_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view responses for their requests" ON match_request_responses;
DROP POLICY IF EXISTS "Users can create responses" ON match_request_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON match_request_responses;

-- Create policies for match request responses
CREATE POLICY "Users can view responses for their requests"
    ON match_request_responses FOR SELECT
    USING (
        request_id IN (
            SELECT id FROM match_requests WHERE creator_id = auth.uid()
        ) OR
        responder_id = auth.uid()
    );

CREATE POLICY "Users can create responses"
    ON match_request_responses FOR INSERT
    WITH CHECK (
        responder_id = auth.uid() AND
        request_id IN (
            SELECT id FROM match_requests 
            WHERE status = 'open' 
            AND creator_id != auth.uid()
        )
    );

CREATE POLICY "Users can update their own responses"
    ON match_request_responses FOR UPDATE
    USING (responder_id = auth.uid())
    WITH CHECK (responder_id = auth.uid());

-- Add updated_at trigger if it doesn't exist
DO $$ BEGIN
    CREATE TRIGGER update_match_request_responses_updated_at
        BEFORE UPDATE ON match_request_responses
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;