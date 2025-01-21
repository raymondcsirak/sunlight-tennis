-- Inserare meciuri pentru cereri acceptate care nu au un meci
INSERT INTO matches (player1_id, player2_id, request_id)
SELECT 
  mr.creator_id as player1_id,
  mrr.responder_id as player2_id,
  mr.id as request_id
FROM match_requests mr
JOIN match_request_responses mrr ON mr.id = mrr.request_id
WHERE mrr.status = 'accepted'
AND NOT EXISTS (
  SELECT 1 FROM matches m 
  WHERE m.request_id = mr.id
);
