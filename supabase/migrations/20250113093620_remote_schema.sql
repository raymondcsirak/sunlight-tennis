alter table "public"."match_winner_selections" drop constraint "unique_selector_per_match";

drop index if exists "public"."unique_selector_per_match";

alter table "public"."profiles" add column "matches_won" integer default 0;

alter table "public"."profiles" add constraint "profiles_matches_won_check" CHECK ((matches_won >= 0)) not valid;

alter table "public"."profiles" validate constraint "profiles_matches_won_check";


