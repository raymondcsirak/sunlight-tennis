-- Create a stored procedure for court booking that handles XP and notifications
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