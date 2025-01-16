drop policy "Anyone can view confirmed bookings" on "public"."court_bookings";

alter type "public"."achievement_type" rename to "achievement_type__old_version_to_be_dropped";

create type "public"."achievement_type" as enum ('first_match_win', 'matches_won_50', 'matches_won_100', 'streak_master_10', 'court_veteran_50', 'court_master_100', 'training_expert_25', 'training_master_50', 'training_legend_100', 'platform_pioneer', 'season_champion', 'matches_won_10', 'matches_won_25', 'streak_3', 'streak_5', 'court_bookings_10', 'court_bookings_25', 'training_sessions_10', 'first_login');

alter table "public"."achievements" alter column type type "public"."achievement_type" using type::text::"public"."achievement_type";

select 1; -- CREATE INDEX court_bookings_no_overlap ON public.court_bookings USING gist (court_id, tstzrange(start_time, end_time));

select 1; -- CREATE INDEX training_sessions_student_no_overlap ON public.training_sessions USING gist (student_id, tstzrange(start_time, end_time));

alter table "public"."court_bookings" add constraint "court_bookings_no_overlap" EXCLUDE USING gist (court_id WITH =, tstzrange(start_time, end_time) WITH &&);

alter table "public"."training_sessions" add constraint "training_sessions_student_no_overlap" EXCLUDE USING gist (student_id WITH =, tstzrange(start_time, end_time) WITH &&);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_player_stats_on_booking_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only recalculate stats for new bookings or when changing to confirmed status
    IF (TG_OP = 'INSERT') OR 
       (TG_OP = 'UPDATE' AND NEW.booking_status = 'confirmed' AND OLD.booking_status != 'confirmed') THEN
        PERFORM calculate_player_stats(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_player_stats_on_training_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only recalculate stats for new sessions or when changing to confirmed status
    IF (TG_OP = 'INSERT') OR 
       (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status != 'confirmed') THEN
        PERFORM calculate_player_stats(NEW.student_id);
    END IF;
    RETURN NEW;
END;
$function$
;

create policy "Users can view all confirmed bookings"
on "public"."court_bookings"
as permissive
for select
to public
using (((booking_status = 'confirmed'::booking_status) OR (auth.uid() = user_id)));



