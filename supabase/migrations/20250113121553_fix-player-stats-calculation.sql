-- Recalculeaza stats pentru toate user-ii
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Obtine toate user-ii care au jucat meciuri
    FOR user_record IN 
        SELECT DISTINCT 
            CASE 
                WHEN player1_id = winner_id THEN player1_id
                WHEN player2_id = winner_id THEN player2_id
                ELSE player1_id
            END as user_id
        FROM matches
        WHERE winner_id IS NOT NULL
    LOOP
        -- Calculeaza stats pentru fiecare user
        PERFORM calculate_player_stats(user_record.user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Sterge si recreeaza triggerul pentru a asigura ca functioneaza
DROP TRIGGER IF EXISTS match_stats_update ON matches;
CREATE TRIGGER match_stats_update
    AFTER INSERT OR UPDATE OF winner_id
    ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats_on_match_change();

-- Permite executie doar pentru useri autentificati
GRANT EXECUTE ON FUNCTION calculate_player_stats(UUID) TO authenticated;
