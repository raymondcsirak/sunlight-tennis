-- Drop any existing achievement functions
DROP FUNCTION IF EXISTS retroactively_award_achievements(UUID) CASCADE;
DROP FUNCTION IF EXISTS award_achievement(UUID, achievement_type, TEXT, TEXT, achievement_tier, TEXT, JSONB) CASCADE;

-- Achievement types
DROP TYPE IF EXISTS achievement_type CASCADE;
CREATE TYPE achievement_type AS ENUM (
  'first_match_win',          -- First match won (Gold)
  'matches_won_50',          -- 50 matches won (Gold)
  'matches_won_100',         -- 100 matches won (Gold)
  'streak_master_10',        -- 10-match winning streak (Gold)
  'court_veteran_50',        -- 50 court bookings (Silver)
  'court_master_100',        -- 100 court bookings (Gold)
  'training_expert_25',      -- 25 training sessions (Silver)
  'training_master_50',      -- 50 training sessions (Gold)
  'training_legend_100',     -- 100 training sessions (Gold)
  'platform_pioneer',        -- Early adopter/high engagement (Gold)
  'season_champion'          -- Highest win rate in a season (Platinum)
);

-- Achievement tiers
DROP TYPE IF EXISTS achievement_tier CASCADE;
CREATE TYPE achievement_tier AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum'
);

-- Achievements table
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

-- Simple atomic function to award achievement and create notification
CREATE OR REPLACE FUNCTION award_achievement_with_notification(
  p_user_id UUID,
  p_type achievement_type,
  p_name TEXT,
  p_description TEXT,
  p_tier achievement_tier,
  p_icon_path TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS void AS $$
BEGIN
  -- Insert achievement if it doesn't exist
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

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own achievements"
ON achievements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON TABLE achievements TO authenticated;
GRANT EXECUTE ON FUNCTION award_achievement_with_notification TO authenticated;
