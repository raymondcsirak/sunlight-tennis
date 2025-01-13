-- Drop existing type if exists
DROP TYPE IF EXISTS achievement_tier CASCADE;

-- Create achievement tier type
CREATE TYPE achievement_tier AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum'
);

-- Add tier column if it doesn't exist
ALTER TABLE achievements 
  ADD COLUMN IF NOT EXISTS tier TEXT;

-- Update achievements table to use achievement_tier
ALTER TABLE achievements 
  ALTER COLUMN tier TYPE achievement_tier 
  USING tier::achievement_tier;

-- Drop existing function to recreate with proper type
DROP FUNCTION IF EXISTS award_achievement(UUID, achievement_type, TEXT, TEXT, achievement_tier, TEXT, JSONB);

-- Recreate the award_achievement function with proper type
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION award_achievement(UUID, achievement_type, TEXT, TEXT, achievement_tier, TEXT, JSONB) TO authenticated;
