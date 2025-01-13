-- Add new achievement types to the enum
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'matches_won_10';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'matches_won_25';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'streak_3';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'streak_5';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'court_bookings_10';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'court_bookings_25';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'training_sessions_10';

-- Drop and recreate the retroactive check function to include minor achievements
CREATE OR REPLACE FUNCTION retroactively_award_achievements(p_user_id UUID)
RETURNS TABLE (debug_info JSONB) AS $$
DECLARE
  stats RECORD;
  debug_data JSONB;
BEGIN
  -- Get all stats at once
  SELECT * INTO stats
  FROM player_stats
  WHERE user_id = p_user_id;

  -- Store debug info
  debug_data := jsonb_build_object(
    'user_id', p_user_id,
    'total_matches', stats.total_matches,
    'won_matches', stats.won_matches,
    'total_bookings', stats.total_bookings,
    'total_trainings', stats.total_trainings
  );

  -- Match Achievements (Major)
  IF stats.won_matches >= 1 THEN
    PERFORM award_achievement(
      p_user_id, 'first_match_win',
      'First Victory', 'Won your first match!',
      'gold', '/trophies/major/first-match.svg'
    );
  END IF;

  IF stats.won_matches >= 50 THEN
    PERFORM award_achievement(
      p_user_id, 'matches_won_50',
      'Match Master', 'Won 50 matches!',
      'gold', '/trophies/major/match-master.svg'
    );
  END IF;

  IF stats.won_matches >= 100 THEN
    PERFORM award_achievement(
      p_user_id, 'matches_won_100',
      'Match Legend', 'Won 100 matches!',
      'gold', '/trophies/major/match-legend.svg'
    );
  END IF;

  -- Match Achievements (Minor)
  IF stats.won_matches >= 10 THEN
    PERFORM award_achievement(
      p_user_id, 'matches_won_10',
      'Rising Star', 'Won 10 matches',
      'bronze', 'Star'
    );
  END IF;

  IF stats.won_matches >= 25 THEN
    PERFORM award_achievement(
      p_user_id, 'matches_won_25',
      'Match Expert', 'Won 25 matches',
      'silver', 'Award'
    );
  END IF;

  -- Court Booking Achievements (Major)
  IF stats.total_bookings >= 50 THEN
    PERFORM award_achievement(
      p_user_id, 'court_veteran_50',
      'Court Veteran', 'Booked 50 court sessions',
      'silver', '/trophies/major/court-veteran.svg'
    );
  END IF;

  IF stats.total_bookings >= 100 THEN
    PERFORM award_achievement(
      p_user_id, 'court_master_100',
      'Court Master', 'Booked 100 court sessions',
      'gold', '/trophies/major/court-master.svg'
    );
  END IF;

  -- Court Booking Achievements (Minor)
  IF stats.total_bookings >= 10 THEN
    PERFORM award_achievement(
      p_user_id, 'court_bookings_10',
      'Court Regular', 'Booked 10 court sessions',
      'bronze', 'Calendar'
    );
  END IF;

  IF stats.total_bookings >= 25 THEN
    PERFORM award_achievement(
      p_user_id, 'court_bookings_25',
      'Court Expert', 'Booked 25 court sessions',
      'silver', 'Target'
    );
  END IF;

  -- Training Achievements (Major)
  IF stats.total_trainings >= 25 THEN
    PERFORM award_achievement(
      p_user_id, 'training_expert_25',
      'Training Expert', 'Completed 25 training sessions',
      'silver', '/trophies/major/training-expert.svg'
    );
  END IF;

  IF stats.total_trainings >= 50 THEN
    PERFORM award_achievement(
      p_user_id, 'training_master_50',
      'Training Master', 'Completed 50 training sessions',
      'gold', '/trophies/major/training-master.svg'
    );
  END IF;

  IF stats.total_trainings >= 100 THEN
    PERFORM award_achievement(
      p_user_id, 'training_legend_100',
      'Training Legend', 'Completed 100 training sessions',
      'gold', '/trophies/major/training-legend.svg'
    );
  END IF;

  -- Training Achievements (Minor)
  IF stats.total_trainings >= 10 THEN
    PERFORM award_achievement(
      p_user_id, 'training_sessions_10',
      'Training Regular', 'Completed 10 training sessions',
      'bronze', 'Clock'
    );
  END IF;

  RETURN QUERY SELECT debug_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION retroactively_award_achievements(UUID) TO authenticated;
