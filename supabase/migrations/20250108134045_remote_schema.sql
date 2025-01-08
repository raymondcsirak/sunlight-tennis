create sequence "public"."courts_id_seq";

alter table "public"."court_bookings" drop constraint "court_bookings_no_overlap";

select 1; -- drop index if exists "public"."court_bookings_no_overlap";

alter table "public"."court_bookings" alter column "payment_status" drop default;

alter type "public"."payment_status" rename to "payment_status__old_version_to_be_dropped";

create type "public"."payment_status" as enum ('pending', 'completed', 'failed', 'refunded');

alter table "public"."court_bookings" alter column payment_status type "public"."payment_status" using payment_status::text::"public"."payment_status";

alter table "public"."court_bookings" alter column "payment_status" set default 'pending'::payment_status;

drop type "public"."payment_status__old_version_to_be_dropped";

alter table "public"."bookings" add column "payment_status" payment_status default 'pending'::payment_status;

alter table "public"."bookings" add column "status" booking_status default 'pending'::booking_status;

alter table "public"."courts" add column "surface" surface_type not null;

alter table "public"."courts" alter column "hourly_rate" set data type integer using "hourly_rate"::integer;

alter sequence "public"."courts_id_seq" owned by "public"."courts"."id";

set check_function_bodies = off;

CREATE OR REPLACE PROCEDURE public.create_court_booking(IN p_user_id uuid, IN p_court_id integer, IN p_start_time timestamp with time zone, IN p_end_time timestamp with time zone, IN p_players integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $procedure$
DECLARE
    v_court_name TEXT;
    v_hourly_rate INTEGER;
    v_duration_hours FLOAT;
    v_total_price INTEGER;
    v_booking_id UUID;
    v_xp_amount INTEGER := 50; -- Base XP for court booking
BEGIN
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
        v_duration_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
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
            p_start_time,
            p_end_time,
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
                to_char(p_start_time, 'YYYY-MM-DD'),
                to_char(p_start_time, 'HH24:MI')
            ),
            jsonb_build_object(
                'court_id', p_court_id,
                'booking_id', v_booking_id,
                'start_time', p_start_time,
                'end_time', p_end_time
            )
        );

        -- Commit transaction
        COMMIT;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on error
        ROLLBACK;
        RAISE;
    END;
END;
$procedure$
;


