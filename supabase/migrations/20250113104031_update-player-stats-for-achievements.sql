-- Sterge functia existenta de premii daca exista
DROP FUNCTION IF EXISTS retroactively_award_achievements(UUID) CASCADE;

-- Adauga coloanele lipsa de premii-related la player_stats
ALTER TABLE player_stats
ADD COLUMN IF NOT EXISTS total_bookings INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_trainings INT DEFAULT 0;

-- Actualizeaza functia de premii retroactive pentru a folosi player_stats
CREATE OR REPLACE FUNCTION retroactively_award_achievements(p_user_id UUID)
RETURNS TABLE (debug_info JSONB) AS $$
DECLARE
  stats RECORD;
  debug_data JSONB;
BEGIN
  -- Obtine toate stats-urile in acelasi timp
  SELECT * INTO stats
  FROM player_stats
  WHERE user_id = p_user_id;

  -- Stocheaza info de debug
  debug_data := jsonb_build_object(
    'user_id', p_user_id,
    'total_matches', stats.total_matches,
    'won_matches', stats.won_matches,
    'total_bookings', stats.total_bookings,
    'total_trainings', stats.total_trainings
  );

  -- Premii de match
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

  -- Premii de booking
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

  -- Premii de training
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

  RETURN QUERY SELECT debug_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
