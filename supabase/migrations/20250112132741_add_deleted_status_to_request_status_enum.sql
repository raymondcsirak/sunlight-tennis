-- Step 1: Create a new enum type with the additional value
CREATE TYPE request_status_new AS ENUM ('open', 'pending', 'confirmed', 'cancelled', 'deleted');

-- Step 2: Update the match_requests table to use the new enum type
ALTER TABLE match_requests 
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE match_requests 
  ALTER COLUMN status TYPE request_status_new 
  USING status::text::request_status_new;

ALTER TABLE match_requests 
  ALTER COLUMN status SET DEFAULT 'open';

-- Step 3: Drop the old enum type
DROP TYPE request_status;

-- Step 4: Rename the new enum type to the original name
ALTER TYPE request_status_new RENAME TO request_status;
