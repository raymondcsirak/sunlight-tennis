-- Function to award achievements and create notifications atomically
CREATE OR REPLACE FUNCTION award_achievements_with_notifications(
  p_user_id UUID,
  p_achievements JSONB
) RETURNS void AS $$
DECLARE
  achievement RECORD;
BEGIN
  -- Insert achievements and corresponding notifications in a single transaction
  FOR achievement IN SELECT * FROM jsonb_array_elements(p_achievements)
  LOOP
    -- Insert the achievement
    INSERT INTO achievements (
      user_id,
      type,
      name,
      description,
      metadata
    ) VALUES (
      p_user_id,
      (achievement.value->>'type')::achievement_type,
      achievement.value->>'name',
      achievement.value->>'description',
      COALESCE((achievement.value->>'metadata')::jsonb, '{}'::jsonb)
    )
    ON CONFLICT (user_id, type) DO NOTHING;

    -- Only create notification if achievement was inserted (not already earned)
    IF FOUND THEN
      -- Insert the notification
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        p_user_id,
        'achievement',
        'Achievement Unlocked! 🏆',
        achievement.value->>'name',
        jsonb_build_object(
          'type', achievement.value->>'type',
          'name', achievement.value->>'name',
          'description', achievement.value->>'description',
          'metadata', COALESCE((achievement.value->>'metadata')::jsonb, '{}'::jsonb)
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the function can be executed by authenticated users
GRANT EXECUTE ON FUNCTION award_achievements_with_notifications(UUID, JSONB) TO authenticated;

-- Add 'achievement' to notification_type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'notification_type' 
    AND typarray <> 0
    AND EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = pg_type.oid 
      AND enumlabel = 'achievement'
    )
  ) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'achievement';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
