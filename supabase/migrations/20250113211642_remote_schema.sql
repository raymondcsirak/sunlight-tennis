alter type "public"."achievement_type" rename to "achievement_type__old_version_to_be_dropped";

create type "public"."achievement_type" as enum ('first_match_win', 'matches_won_50', 'matches_won_100', 'streak_master_10', 'court_veteran_50', 'court_master_100', 'training_expert_25', 'training_master_50', 'training_legend_100', 'platform_pioneer', 'season_champion', 'matches_won_10', 'matches_won_25', 'streak_3', 'streak_5', 'court_bookings_10', 'court_bookings_25', 'training_sessions_10', 'first_login');

alter table "public"."achievements" alter column type type "public"."achievement_type" using type::text::"public"."achievement_type";

drop type "public"."achievement_type__old_version_to_be_dropped";


