-- Create enum types
CREATE TYPE surface_type AS ENUM ('clay', 'hard', 'grass', 'artificial');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create courts table if not exists
CREATE TABLE IF NOT EXISTS courts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    surface surface_type NOT NULL,
    is_indoor BOOLEAN DEFAULT false,
    hourly_rate DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create court_bookings table if not exists
CREATE TABLE IF NOT EXISTS court_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    court_id UUID REFERENCES courts(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    players_count INTEGER NOT NULL,
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

    -- Prevent overlapping bookings for the same court
    CONSTRAINT no_overlapping_bookings
        EXCLUDE USING gist (
            court_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        )
);

-- Create user_xp table if not exists
CREATE TABLE IF NOT EXISTS user_xp (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Courts are viewable by everyone"
    ON courts FOR SELECT
    USING (true);

CREATE POLICY "Users can view own bookings"
    ON court_bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
    ON court_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
    ON court_bookings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own xp"
    ON user_xp FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER set_courts_updated_at
    BEFORE UPDATE ON courts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_court_bookings_updated_at
    BEFORE UPDATE ON court_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample courts
INSERT INTO courts (name, surface, hourly_rate, is_indoor) VALUES
    ('Court 1', 'clay', 50.00, false),
    ('Court 2', 'hard', 45.00, false),
    ('Court 3', 'clay', 50.00, false),
    ('Court 4', 'hard', 45.00, false)
ON CONFLICT DO NOTHING; 