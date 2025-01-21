-- In primul rand, stergere constrangerile de foreign key existente
ALTER TABLE match_request_responses
DROP CONSTRAINT IF EXISTS match_request_responses_request_id_fkey;

-- Apoi, adaugare constrangerile de foreign key cu CASCADE delete
ALTER TABLE match_request_responses
ADD CONSTRAINT match_request_responses_request_id_fkey
FOREIGN KEY (request_id)
REFERENCES match_requests(id)
ON DELETE CASCADE;