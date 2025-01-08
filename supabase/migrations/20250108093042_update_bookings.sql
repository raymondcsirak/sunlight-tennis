-- Create enum types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Safely drop constraints if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'no_overlapping_bookings'
    ) THEN
        ALTER TABLE court_bookings DROP CONSTRAINT IF EXISTS no_overlapping_bookings;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Alter existing table or create new one
DO $$
BEGIN
    -- Try to alter existing table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'court_bookings') THEN
        -- Add missing columns if they don't exist
        BEGIN
            ALTER TABLE court_bookings 
            ADD COLUMN IF NOT EXISTS players INTEGER NOT NULL DEFAULT 1 CHECK (players >= 1 AND players <= 4),
            ADD COLUMN IF NOT EXISTS booking_status booking_status NOT NULL DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS total_price INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        EXCEPTION WHEN duplicate_column THEN
            -- Column already exists, ignore
            NULL;
        END;
    ELSE
        -- Create new table if it doesn't exist
        CREATE TABLE court_bookings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            start_time TIMESTAMPTZ NOT NULL,
            end_time TIMESTAMPTZ NOT NULL,
            players INTEGER NOT NULL CHECK (players >= 1 AND players <= 4),
            total_price INTEGER NOT NULL,
            booking_status booking_status NOT NULL DEFAULT 'pending',
            payment_status payment_status NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;

    -- Add the overlapping bookings constraint
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'no_overlapping_bookings'
    ) THEN
        ALTER TABLE court_bookings
        ADD CONSTRAINT no_overlapping_bookings 
        EXCLUDE USING gist (
            court_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        );
    END IF;

EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, create it
        CREATE TABLE court_bookings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            start_time TIMESTAMPTZ NOT NULL,
            end_time TIMESTAMPTZ NOT NULL,
            players INTEGER NOT NULL CHECK (players >= 1 AND players <= 4),
            total_price INTEGER NOT NULL,
            booking_status booking_status NOT NULL DEFAULT 'pending',
            payment_status payment_status NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Add the overlapping bookings constraint
        ALTER TABLE court_bookings
        ADD CONSTRAINT no_overlapping_bookings 
        EXCLUDE USING gist (
            court_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        );
END $$;

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = current_schema()
        AND c.relname = 'court_bookings'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE court_bookings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "Users can view their own bookings"
            ON court_bookings FOR SELECT
            USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Users can create their own bookings"
            ON court_bookings FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Users can update their own bookings"
            ON court_bookings FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_court_bookings_updated_at'
    ) THEN
        CREATE TRIGGER update_court_bookings_updated_at
            BEFORE UPDATE ON court_bookings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;
