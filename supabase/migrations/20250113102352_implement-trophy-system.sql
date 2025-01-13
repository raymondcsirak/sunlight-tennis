-- Drop existing functions first
DROP FUNCTION IF EXISTS retroactively_award_achievements(UUID);
DROP FUNCTION IF EXISTS award_achievements_with_notifications(UUID, JSONB);

-- Drop existing achievement_type enum and recreate with all trophy types
DROP TYPE IF EXISTS achievement_type CASCADE;
CREATE TYPE achievement_type AS ENUM (
  -- Match Achievements (Gold)
  'first_match_win',          -- First match won (Gold)
  'matches_won_50',          -- 50 matches won (Gold)
  'matches_won_100',         -- 100 matches won (Gold)
  'streak_master_10',        -- 10-match winning streak (Gold)
  
  -- Court Booking Achievements
  'court_veteran_50',        -- 50 court bookings (Silver)
  'court_master_100',        -- 100 court bookings (Gold)
  
  -- Training Achievements
  'training_expert_25',      -- 25 training sessions (Silver)
  'training_master_50',      -- 50 training sessions (Gold)
  'training_legend_100',     -- 100 training sessions (Gold)
  
  -- Special Achievements
  'platform_pioneer',        -- Early adopter/high engagement (Gold)
  'season_champion'          -- Highest win rate in a season (Platinum)
);

-- Add tier type for visual representation
CREATE TYPE achievement_tier AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum'
);

-- Recreate achievements table with tier and visual info
DROP TABLE IF EXISTS achievements CASCADE;
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type achievement_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tier achievement_tier NOT NULL,
  icon_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Function to award achievements with proper tiers and icons
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id UUID,
  p_type achievement_type,
  p_name TEXT,
  p_description TEXT,
  p_tier achievement_tier,
  p_icon_path TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS void AS $$
BEGIN
  INSERT INTO achievements (
    user_id,
    type,
    name,
    description,
    tier,
    icon_path,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_name,
    p_description,
    p_tier,
    p_icon_path,
    p_metadata
  )
  ON CONFLICT (user_id, type) DO NOTHING;

  -- Only create notification if achievement was inserted
  IF FOUND THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      p_user_id,
      'achievement',
      CASE p_tier
        WHEN 'bronze' THEN '🥉 Achievement Unlocked!'
        WHEN 'silver' THEN '🥈 Achievement Unlocked!'
        WHEN 'gold' THEN '🏆 Achievement Unlocked!'
        WHEN 'platinum' THEN '👑 Achievement Unlocked!'
      END,
      p_name,
      jsonb_build_object(
        'type', p_type,
        'name', p_name,
        'description', p_description,
        'tier', p_tier,
        'icon_path', p_icon_path,
        'metadata', p_metadata
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to check and award achievements
CREATE OR REPLACE FUNCTION retroactively_award_achievements(p_user_id UUID)
RETURNS TABLE (debug_info JSONB) AS $$
DECLARE
  total_matches INT;
  total_wins INT;
  max_streak INT;
  total_bookings INT;
  total_trainings INT;
  debug_data JSONB;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO total_matches FROM matches WHERE player1_id = p_user_id OR player2_id = p_user_id;
  SELECT COUNT(*) INTO total_wins FROM matches WHERE winner_id = p_user_id;
  SELECT COALESCE(MAX(current_streak), 0) INTO max_streak FROM player_stats WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO total_bookings FROM court_bookings WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO total_trainings FROM training_sessions WHERE user_id = p_user_id;

  -- Store debug info
  debug_data := jsonb_build_object(
    'user_id', p_user_id,
    'total_matches', total_matches,
    'total_wins', total_wins,
    'max_streak', max_streak,
    'total_bookings', total_bookings,
    'total_trainings', total_trainings
  );

  -- Match Achievements
  IF total_wins >= 1 THEN
    PERFORM award_achievement(
      p_user_id, 'first_match_win',
      'First Victory', 'Won your first match!',
      'gold', '/trophies/major/first-match.svg'
    );
  END IF;

  IF total_wins >= 50 THEN
    PERFORM award_achievement(
      p_user_id, 'matches_won_50',
      'Match Master', 'Won 50 matches!',
      'gold', '/trophies/major/match-master.svg'
    );
  END IF;

  IF total_wins >= 100 THEN
    PERFORM award_achievement(
      p_user_id, 'matches_won_100',
      'Match Legend', 'Won 100 matches!',
      'gold', '/trophies/major/match-legend.svg'
    );
  END IF;

  -- Streak Achievement
  IF max_streak >= 10 THEN
    PERFORM award_achievement(
      p_user_id, 'streak_master_10',
      'Streak Master', 'Achieved a 10-match winning streak!',
      'gold', '/trophies/major/streak-master.svg'
    );
  END IF;

  -- Court Booking Achievements
  IF total_bookings >= 50 THEN
    PERFORM award_achievement(
      p_user_id, 'court_veteran_50',
      'Court Veteran', 'Booked 50 court sessions',
      'silver', '/trophies/major/court-veteran.svg'
    );
  END IF;

  IF total_bookings >= 100 THEN
    PERFORM award_achievement(
      p_user_id, 'court_master_100',
      'Court Master', 'Booked 100 court sessions',
      'gold', '/trophies/major/court-master.svg'
    );
  END IF;

  -- Training Achievements
  IF total_trainings >= 25 THEN
    PERFORM award_achievement(
      p_user_id, 'training_expert_25',
      'Training Expert', 'Completed 25 training sessions',
      'silver', '/trophies/major/training-expert.svg'
    );
  END IF;

  IF total_trainings >= 50 THEN
    PERFORM award_achievement(
      p_user_id, 'training_master_50',
      'Training Master', 'Completed 50 training sessions',
      'gold', '/trophies/major/training-master.svg'
    );
  END IF;

  IF total_trainings >= 100 THEN
    PERFORM award_achievement(
      p_user_id, 'training_legend_100',
      'Training Legend', 'Completed 100 training sessions',
      'gold', '/trophies/major/training-legend.svg'
    );
  END IF;

  RETURN QUERY SELECT debug_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION award_achievement(UUID, achievement_type, TEXT, TEXT, achievement_tier, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION retroactively_award_achievements(UUID) TO authenticated;
GRANT ALL ON TABLE achievements TO authenticated;