-- Add foreign key constraint for creator_id in match_requests table
ALTER TABLE match_requests
DROP CONSTRAINT IF EXISTS match_requests_creator_id_fkey;

ALTER TABLE match_requests
ADD CONSTRAINT match_requests_creator_id_fkey
FOREIGN KEY (creator_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Update the RLS policies to use the new relationship
DROP POLICY IF EXISTS "Users can view all match requests" ON match_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON match_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON match_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON match_requests;

CREATE POLICY "Users can view all match requests"
    ON match_requests FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own requests"
    ON match_requests FOR INSERT
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own requests"
    ON match_requests FOR UPDATE
    USING (creator_id = auth.uid())
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can delete their own requests"
    ON match_requests FOR DELETE
    USING (creator_id = auth.uid()); 