-- Adaugare coloana user_id in tabelul coaches
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Stergere si recreare functie stored
DROP FUNCTION IF EXISTS create_training_session;

CREATE OR REPLACE FUNCTION create_training_session(
    p_student_id UUID,
    p_coach_id UUID,
    p_start_time TEXT,
    p_end_time TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coach_name TEXT;
    v_hourly_rate INTEGER;
    v_duration_hours FLOAT;
    v_total_price INTEGER;
    v_session_id UUID;
    v_xp_amount INTEGER := 100;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
BEGIN
    -- Convertire text in timestamptz
    v_start_time := p_start_time::TIMESTAMPTZ;
    v_end_time := p_end_time::TIMESTAMPTZ;

    -- Start transactie
    BEGIN
        -- Luare detalii antrenor din tabelul coaches
        SELECT name, hourly_rate INTO v_coach_name, v_hourly_rate
        FROM coaches
        WHERE id = p_coach_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Coach not found';
        END IF;

        -- Calculare durata si pret
        v_duration_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) / 3600;
        v_total_price := v_hourly_rate * v_duration_hours;

        -- Creare sesiune de antrenament
        INSERT INTO training_sessions (
            coach_id,
            student_id,
            user_id,
            start_time,
            end_time,
            total_price,
            notes,
            status,
            payment_status
        ) VALUES (
            p_coach_id,
            p_student_id,
            p_student_id,
            v_start_time,
            v_end_time,
            v_total_price,
            p_notes,
            'confirmed',
            'pending'
        ) RETURNING id INTO v_session_id;

        -- Adaugare XP
        INSERT INTO xp_history (
            user_id,
            xp_amount,
            activity_type,
            description
        ) VALUES (
            p_student_id,
            v_xp_amount,
            'training_session',
            format('Booked training session with %s for %s hours', v_coach_name, v_duration_hours)
        );

        -- Actualizare total XP
        UPDATE player_xp
        SET current_xp = current_xp + v_xp_amount
        WHERE user_id = p_student_id;

        -- Creare notificare pentru student
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            p_student_id,
            'training_booked',
            'Training Session Confirmed',
            format('Your training session with %s on %s at %s has been confirmed.',
                v_coach_name,
                to_char(v_start_time, 'YYYY-MM-DD'),
                to_char(v_start_time, 'HH24:MI')
            ),
            jsonb_build_object(
                'session_id', v_session_id,
                'coach_id', p_coach_id,
                'start_time', v_start_time,
                'end_time', v_end_time
            )
        );

        -- Return success
        RETURN jsonb_build_object(
            'success', true,
            'session_id', v_session_id
        );

    EXCEPTION WHEN OTHERS THEN
        -- Rollback transactie in caz de eroare
        RAISE;
    END;
END;
$$;
