-- Drop existing objects if they exist
DROP FUNCTION IF EXISTS create_court_booking;
DROP TABLE IF EXISTS court_bookings CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS surface_type CASCADE;

-- Create enum types
CREATE TYPE surface_type AS ENUM ('clay', 'hard', 'grass', 'artificial');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- Create courts table if it doesn't exist
CREATE TABLE IF NOT EXISTS courts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    surface surface_type NOT NULL,
    is_indoor BOOLEAN DEFAULT false,
    hourly_rate INTEGER NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create court_bookings table
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Changed constraint name to be more unique
    CONSTRAINT court_bookings_no_overlap EXCLUDE USING gist (
        court_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    )
);

-- Enable RLS
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_bookings ENABLE ROW LEVEL SECURITY;
-- First drop existing policies
DROP POLICY IF EXISTS "Courts are viewable by everyone" ON courts;
DROP POLICY IF EXISTS "Users can view their own bookings" ON court_bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON court_bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON court_bookings;
-- Then create the policies
CREATE POLICY "Courts are viewable by everyone"
    ON courts FOR SELECT
    USING (true);

CREATE POLICY "Users can view their own bookings"
    ON court_bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
    ON court_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
    ON court_bookings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_courts_updated_at ON courts;
CREATE TRIGGER update_courts_updated_at
    BEFORE UPDATE ON courts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_court_bookings_updated_at ON court_bookings;
CREATE TRIGGER update_court_bookings_updated_at
    BEFORE UPDATE ON court_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create the booking procedure
CREATE OR REPLACE FUNCTION create_court_booking(
    p_user_id UUID,
    p_court_id UUID,
    p_start_time TEXT,
    p_end_time TEXT,
    p_players INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_court_name TEXT;
    v_hourly_rate INTEGER;
    v_duration_hours FLOAT;
    v_total_price INTEGER;
    v_booking_id UUID;
    v_xp_amount INTEGER := 50; -- Base XP for court booking
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
BEGIN
    -- Convert text timestamps to timestamptz
    v_start_time := p_start_time::TIMESTAMPTZ;
    v_end_time := p_end_time::TIMESTAMPTZ;

    -- Start transaction
    BEGIN
        -- Get court details
        SELECT name, hourly_rate INTO v_court_name, v_hourly_rate
        FROM courts
        WHERE id = p_court_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Court not found';
        END IF;

        -- Calculate duration and price
        v_duration_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) / 3600;
        v_total_price := v_hourly_rate * v_duration_hours;

        -- Create booking
        INSERT INTO court_bookings (
            court_id,
            user_id,
            start_time,
            end_time,
            players,
            total_price,
            booking_status,
            payment_status
        ) VALUES (
            p_court_id,
            p_user_id,
            v_start_time,
            v_end_time,
            p_players,
            v_total_price,
            'confirmed',
            'pending'
        ) RETURNING id INTO v_booking_id;

        -- Award XP
        INSERT INTO xp_history (
            user_id,
            xp_amount,
            activity_type,
            description
        ) VALUES (
            p_user_id,
            v_xp_amount,
            'court_booking',
            format('Booked court %s for %s hours', v_court_name, v_duration_hours)
        );

        -- Update total XP
        UPDATE player_xp
        SET current_xp = current_xp + v_xp_amount
        WHERE user_id = p_user_id;

        -- Create notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            p_user_id,
            'court_booked',
            'Court Booking Confirmed',
            format('Your booking for %s on %s at %s has been confirmed.',
                v_court_name,
                to_char(v_start_time, 'YYYY-MM-DD'),
                to_char(v_start_time, 'HH24:MI')
            ),
            jsonb_build_object(
                'court_id', p_court_id,
                'booking_id', v_booking_id,
                'start_time', v_start_time,
                'end_time', v_end_time
            )
        );

        -- Return success
        RETURN jsonb_build_object(
            'success', true,
            'booking_id', v_booking_id
        );

    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on error
        RAISE;
    END;
END;
$$;