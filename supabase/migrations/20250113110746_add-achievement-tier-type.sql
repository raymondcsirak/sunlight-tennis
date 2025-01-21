-- Sterge tipul existent daca exista
DROP TYPE IF EXISTS achievement_tier CASCADE;

-- Creeaza tipul de premii
CREATE TYPE achievement_tier AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum'
);

-- Adauga coloana tier daca nu exista deja
ALTER TABLE achievements 
  ADD COLUMN IF NOT EXISTS tier TEXT;

-- Actualizeaza tabelul de premii pentru a folosi achievement_tier
ALTER TABLE achievements 
  ALTER COLUMN tier TYPE achievement_tier 
  USING tier::achievement_tier;

-- Sterge functia existenta pentru a o recrea cu tipul corect
DROP FUNCTION IF EXISTS award_achievement(UUID, achievement_type, TEXT, TEXT, achievement_tier, TEXT, JSONB);

-- Recreeaza functia award_achievement cu tipul corect
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
  -- Insereaza premia daca nu exista deja
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

  -- Creeaza notificare doar daca premia a fost insereata
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

-- Permite executie doar pentru useri autentificati
GRANT EXECUTE ON FUNCTION award_achievement(UUID, achievement_type, TEXT, TEXT, achievement_tier, TEXT, JSONB) TO authenticated;
