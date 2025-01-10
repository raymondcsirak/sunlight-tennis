-- First, drop the existing foreign key constraint
ALTER TABLE match_request_responses
DROP CONSTRAINT IF EXISTS match_request_responses_request_id_fkey;

-- Then, add it back with CASCADE delete
ALTER TABLE match_request_responses
ADD CONSTRAINT match_request_responses_request_id_fkey
FOREIGN KEY (request_id)
REFERENCES match_requests(id)
ON DELETE CASCADE;
