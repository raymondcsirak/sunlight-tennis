-- Drop existing foreign key if it exists
ALTER TABLE match_request_responses
DROP CONSTRAINT IF EXISTS match_request_responses_responder_id_fkey;

-- Add the foreign key constraint
ALTER TABLE match_request_responses
ADD CONSTRAINT match_request_responses_responder_id_fkey
FOREIGN KEY (responder_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Update RLS policies to include profile joins
DROP POLICY IF EXISTS "Users can view responses for their requests" ON match_request_responses;
CREATE POLICY "Users can view responses for their requests"
    ON match_request_responses FOR SELECT
    USING (
        request_id IN (
            SELECT id FROM match_requests WHERE creator_id = auth.uid()
        ) OR
        responder_id = auth.uid()
    ); 