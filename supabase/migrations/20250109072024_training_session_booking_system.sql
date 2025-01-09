-- Create training session status enum
CREATE TYPE training_session_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create training sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coach_id UUID REFERENCES auth.users(id),
    student_id UUID REFERENCES auth.users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status training_session_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    total_price INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent double bookings for coaches
    CONSTRAINT no_overlapping_coach_sessions
        EXCLUDE USING gist (
            coach_id WITH =,
            tstzrange(start_time, end_time) WITH &&
        ),
    -- Prevent double bookings for students
    CONSTRAINT no_overlapping_student_sessions
        EXCLUDE USING gist (
            student_id WITH =,
            tstzrange(start_time, end_time) WITH &&
        )
);

-- Add trigger for updated_at
CREATE TRIGGER set_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
