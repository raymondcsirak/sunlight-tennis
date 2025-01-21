-- Adaugare coloana request_id in tabelul matches
ALTER TABLE matches
ADD COLUMN request_id UUID REFERENCES match_requests(id) ON DELETE CASCADE;

-- Actualizare tabelul matches pentru setare request_id in functie de meciuri existente
-- Aceasta presupune ca meciurile au fost create din cereri de meci acceptate
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
