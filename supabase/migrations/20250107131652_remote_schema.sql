drop policy "Users can insert their own skills" on "public"."player_skills";

drop policy "Users can update their own skills" on "public"."player_skills";

drop policy "Users can view their own skills" on "public"."player_skills";

alter table "public"."player_skills" drop constraint "player_skills_user_id_fkey";

create table "public"."court_bookings" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "court_id" uuid not null,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."court_bookings" enable row level security;

alter table "public"."player_skills" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."player_skills" alter column "id" set default uuid_generate_v4();

alter table "public"."player_skills" alter column "updated_at" set default timezone('utc'::text, now());

CREATE UNIQUE INDEX court_bookings_pkey ON public.court_bookings USING btree (id);

alter table "public"."court_bookings" add constraint "court_bookings_pkey" PRIMARY KEY using index "court_bookings_pkey";

alter table "public"."court_bookings" add constraint "court_bookings_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text]))) not valid;

alter table "public"."court_bookings" validate constraint "court_bookings_status_check";

alter table "public"."court_bookings" add constraint "court_bookings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."court_bookings" validate constraint "court_bookings_user_id_fkey";

alter table "public"."player_skills" add constraint "player_skills_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."player_skills" validate constraint "player_skills_user_id_fkey";

grant delete on table "public"."court_bookings" to "anon";

grant insert on table "public"."court_bookings" to "anon";

grant references on table "public"."court_bookings" to "anon";

grant select on table "public"."court_bookings" to "anon";

grant trigger on table "public"."court_bookings" to "anon";

grant truncate on table "public"."court_bookings" to "anon";

grant update on table "public"."court_bookings" to "anon";

grant delete on table "public"."court_bookings" to "authenticated";

grant insert on table "public"."court_bookings" to "authenticated";

grant references on table "public"."court_bookings" to "authenticated";

grant select on table "public"."court_bookings" to "authenticated";

grant trigger on table "public"."court_bookings" to "authenticated";

grant truncate on table "public"."court_bookings" to "authenticated";

grant update on table "public"."court_bookings" to "authenticated";

grant delete on table "public"."court_bookings" to "service_role";

grant insert on table "public"."court_bookings" to "service_role";

grant references on table "public"."court_bookings" to "service_role";

grant select on table "public"."court_bookings" to "service_role";

grant trigger on table "public"."court_bookings" to "service_role";

grant truncate on table "public"."court_bookings" to "service_role";

grant update on table "public"."court_bookings" to "service_role";

create policy "Users can insert their own bookings"
on "public"."court_bookings"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own bookings"
on "public"."court_bookings"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own bookings"
on "public"."court_bookings"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert own skills"
on "public"."player_skills"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own skills"
on "public"."player_skills"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own skills"
on "public"."player_skills"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.court_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


