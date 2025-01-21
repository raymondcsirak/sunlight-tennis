-- Step 1: Creeaza un nou tip de enum cu valoarea suplimentara
CREATE TYPE request_status_new AS ENUM ('open', 'pending', 'confirmed', 'cancelled', 'deleted');

-- Step 2: Actualizeaza tabelul match_requests pentru a folosi nou tip de enum
ALTER TABLE match_requests 
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE match_requests 
  ALTER COLUMN status TYPE request_status_new 
  USING status::text::request_status_new;

ALTER TABLE match_requests 
  ALTER COLUMN status SET DEFAULT 'open';

-- Step 3: Sterge tipul de enum vechi
DROP TYPE request_status;

-- Step 4: Redenumeste tipul de enum nou la numele original
ALTER TYPE request_status_new RENAME TO request_status;
