-- Functie pentru a acorda premii si a crea notificari atomically
CREATE OR REPLACE FUNCTION award_achievements_with_notifications(
  p_user_id UUID,
  p_achievements JSONB
) RETURNS void AS $$
DECLARE
  achievement RECORD;
BEGIN
  -- Insereaza premii si notificari corespunzatoare in aceeasi transactie
  FOR achievement IN SELECT * FROM jsonb_array_elements(p_achievements)
  LOOP
    -- Insereaza premia
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

    -- Creeaza notificare doar daca premia a fost insereata (nu a fost deja castigata)
    IF FOUND THEN
      -- Insereaza notificarea
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

-- Asigura ca functia poate fi executata de useri autentificati
GRANT EXECUTE ON FUNCTION award_achievements_with_notifications(UUID, JSONB) TO authenticated;

-- Adauga 'achievement' la notification_type daca nu exista deja
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
