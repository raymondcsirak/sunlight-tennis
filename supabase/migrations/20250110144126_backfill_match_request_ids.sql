-- Backfill request_id for existing matches by finding the corresponding accepted match request
UPDATE matches m
SET request_id = mr.id
FROM match_requests mr
JOIN match_request_responses mrr ON mr.id = mrr.request_id
WHERE mrr.status = 'accepted'
AND m.request_id IS NULL -- Only update matches that don't have a request_id yet
AND (
  (m.player1_id = mr.creator_id AND m.player2_id = mrr.responder_id)
  OR
  (m.player2_id = mr.creator_id AND m.player1_id = mrr.responder_id)
);

-- Add a NOT NULL constraint to request_id after backfilling
ALTER TABLE matches
ALTER COLUMN request_id SET NOT NULL;
