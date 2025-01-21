-- Stergere trigger si functie existente
DROP TRIGGER IF EXISTS validate_match_winner ON match_winner_selections;
DROP FUNCTION IF EXISTS validate_and_update_match_winner();

-- Reset winner_id pentru meciuri care nu au fost validate corect
UPDATE matches
SET winner_id = NULL,
    xp_awarded = false
WHERE winner_id IS NOT NULL
AND id IN (
    SELECT DISTINCT match_id
    FROM match_winner_selections
    GROUP BY match_id
    HAVING COUNT(DISTINCT selected_winner_id) > 1  -- Castigatori diferiti selectati
);

-- Tabelul match_winner_selections si politici RLS
-- Acesta va fi utilizat pentru stocarea selectiilor, dar validarea va avea loc server-side 