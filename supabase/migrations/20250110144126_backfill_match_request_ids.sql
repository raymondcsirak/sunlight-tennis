-- Backfill request_id pentru meciuri existente prin gasire cererii de meci acceptate corespunzatoare
UPDATE matches m
SET request_id = mr.id
FROM match_requests mr
JOIN match_request_responses mrr ON mr.id = mrr.request_id
WHERE mrr.status = 'accepted'
AND m.request_id IS NULL -- Doar actualizare meciuri care nu au request_id
AND (
  (m.player1_id = mr.creator_id AND m.player2_id = mrr.responder_id)
  OR
  (m.player2_id = mr.creator_id AND m.player1_id = mrr.responder_id)
);

-- Adaugare constrangeri de NOT NULL pentru request_id dupa backfilling
ALTER TABLE matches
ALTER COLUMN request_id SET NOT NULL;