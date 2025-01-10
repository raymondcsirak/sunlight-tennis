-- Add request_id column to matches table
ALTER TABLE matches
ADD COLUMN request_id UUID REFERENCES match_requests(id) ON DELETE CASCADE;

-- Update the matches table to set request_id based on existing matches
-- This assumes that matches were created from accepted match requests
UPDATE matches m
SET request_id = mr.id
FROM match_requests mr
JOIN match_request_responses mrr ON mr.id = mrr.request_id
WHERE mrr.status = 'accepted'
AND (
  (m.player1_id = mr.creator_id AND m.player2_id = mrr.responder_id)
  OR
  (m.player2_id = mr.creator_id AND m.player1_id = mrr.responder_id)
);
