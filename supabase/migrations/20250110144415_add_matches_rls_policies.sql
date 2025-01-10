-- Enable RLS on matches table
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view matches they are part of
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
TO authenticated
USING (
  auth.uid() = player1_id OR 
  auth.uid() = player2_id
);

-- Policy to allow creating matches from accepted requests
CREATE POLICY "Users can create matches from accepted requests"
ON matches FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM match_request_responses mrr
    JOIN match_requests mr ON mr.id = mrr.request_id
    WHERE mr.id = request_id
    AND mrr.status = 'accepted'
    AND (
      (auth.uid() = mr.creator_id AND player1_id = mr.creator_id AND player2_id = mrr.responder_id)
      OR
      (auth.uid() = mr.creator_id AND player2_id = mr.creator_id AND player1_id = mrr.responder_id)
    )
  )
);

-- Policy to allow updating matches they are part of
CREATE POLICY "Users can update their own matches"
ON matches FOR UPDATE
TO authenticated
USING (
  auth.uid() = player1_id OR 
  auth.uid() = player2_id
);
