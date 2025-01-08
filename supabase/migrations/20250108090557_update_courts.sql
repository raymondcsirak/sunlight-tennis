-- First, drop all foreign key constraints that reference courts
ALTER TABLE court_bookings DROP CONSTRAINT IF EXISTS court_bookings_court_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_court_id_fkey;
ALTER TABLE match_requests DROP CONSTRAINT IF EXISTS match_requests_court_preference_fkey;

-- Create sequence first
CREATE SEQUENCE IF NOT EXISTS courts_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Update courts table structure
ALTER TABLE courts
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id SET DATA TYPE BIGINT USING id::text::bigint;

-- Set the sequence owner
ALTER SEQUENCE courts_id_seq OWNED BY courts.id;

-- Set the default value using the sequence and add image_url column
ALTER TABLE courts
    ALTER COLUMN id SET DEFAULT nextval('courts_id_seq'),
    ALTER COLUMN hourly_rate SET DATA TYPE INTEGER USING hourly_rate::integer,
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update related tables to match the new data type
ALTER TABLE court_bookings
    ALTER COLUMN court_id SET DATA TYPE BIGINT USING court_id::text::bigint;

ALTER TABLE bookings
    ALTER COLUMN court_id SET DATA TYPE BIGINT USING court_id::text::bigint;

ALTER TABLE match_requests
    ALTER COLUMN court_preference SET DATA TYPE BIGINT USING court_preference::text::bigint;

-- Recreate all foreign key constraints
ALTER TABLE court_bookings
    ADD CONSTRAINT court_bookings_court_id_fkey 
    FOREIGN KEY (court_id) REFERENCES courts(id);

ALTER TABLE bookings
    ADD CONSTRAINT bookings_court_id_fkey 
    FOREIGN KEY (court_id) REFERENCES courts(id);

ALTER TABLE match_requests
    ADD CONSTRAINT match_requests_court_preference_fkey 
    FOREIGN KEY (court_preference) REFERENCES courts(id);