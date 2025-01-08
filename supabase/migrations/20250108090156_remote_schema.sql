create sequence "public"."courts_id_seq";

alter table "public"."bookings" alter column "court_id" set data type bigint using "court_id"::bigint;

alter table "public"."court_bookings" alter column "court_id" set data type bigint using "court_id"::bigint;

alter table "public"."courts" alter column "hourly_rate" set data type integer using "hourly_rate"::integer;

alter table "public"."courts" alter column "id" set default nextval('courts_id_seq'::regclass);

alter table "public"."courts" alter column "id" set data type bigint using "id"::bigint;

alter table "public"."match_requests" alter column "court_preference" set data type bigint using "court_preference"::bigint;

alter sequence "public"."courts_id_seq" owned by "public"."courts"."id";

alter table "public"."court_bookings" add constraint "court_bookings_court_id_fkey" FOREIGN KEY (court_id) REFERENCES courts(id) not valid;

alter table "public"."court_bookings" validate constraint "court_bookings_court_id_fkey";


