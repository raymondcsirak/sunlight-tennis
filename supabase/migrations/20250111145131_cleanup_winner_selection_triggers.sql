-- Drop existing trigger and function
DROP TRIGGER IF EXISTS validate_match_winner ON match_winner_selections;
DROP FUNCTION IF EXISTS validate_and_update_match_winner();

-- Reset winner_id for matches that haven't been properly validated
UPDATE matches
SET winner_id = NULL,
    xp_awarded = false
WHERE winner_id IS NOT NULL
AND id IN (
    SELECT DISTINCT match_id
    FROM match_winner_selections
    GROUP BY match_id
    HAVING COUNT(DISTINCT selected_winner_id) > 1  -- Different winners selected
);

-- Keep the match_winner_selections table and its RLS policies
-- We'll use it to store selections, but validation will happen server-side 