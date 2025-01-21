-- Functie pentru acordare XP pentru o activitate
CREATE OR REPLACE FUNCTION award_xp(
    p_user_id UUID,
    p_activity_type TEXT,
    p_description TEXT
) RETURNS void AS $$
DECLARE
    v_multiplier FLOAT;
    v_base_xp INTEGER;
    v_xp_amount INTEGER;
BEGIN
    -- Obtine multiplicator si XP de baza pentru activitate
    SELECT multiplier, base_xp INTO v_multiplier, v_base_xp
    FROM xp_multipliers
    WHERE activity_type::TEXT = p_activity_type;

    -- Calculeaza suma XP
    v_xp_amount := FLOOR(v_base_xp * v_multiplier);

    -- Inregistreaza castigul XP in istoric
    INSERT INTO xp_history (
        user_id,
        xp_amount,
        activity_type,
        description
    ) VALUES (
        p_user_id,
        v_xp_amount,
        p_activity_type::activity_type,
        p_description
    );

    -- Actualizeaza total XP
    UPDATE player_xp
    SET current_xp = current_xp + v_xp_amount
    WHERE user_id = p_user_id;

    -- Daca recordul player_xp nu exista, il creeaza
    IF NOT FOUND THEN
        INSERT INTO player_xp (user_id, current_xp)
        VALUES (p_user_id, v_xp_amount);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Functie pentru gestionare finalizare meci si acordare XP
CREATE OR REPLACE FUNCTION handle_match_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_player1_name TEXT;
    v_player2_name TEXT;
    v_match_record RECORD;
BEGIN
    -- Doar daca castigatorul este setat si XP nu a fost deja acordat
    IF NEW.winner_id IS NOT NULL AND OLD.winner_id IS NULL AND NOT OLD.xp_awarded THEN
        -- Obtine numele jucatorilor
        SELECT p1.full_name, p2.full_name INTO v_player1_name, v_player2_name
        FROM profiles p1, profiles p2
        WHERE p1.id = NEW.player1_id AND p2.id = NEW.player2_id;

        -- Acorda XP pentru castig
        PERFORM award_xp(
            NEW.winner_id,
            'match_won',
            format('Won match against %s', 
                CASE 
                    WHEN NEW.winner_id = NEW.player1_id THEN v_player2_name 
                    ELSE v_player1_name 
                END
            )
        );

        -- Acorda XP pentru participare la ambii jucatori
        PERFORM award_xp(
            NEW.player1_id,
            'match_played',
            format('Played match against %s', v_player2_name)
        );
        
        PERFORM award_xp(
            NEW.player2_id,
            'match_played',
            format('Played match against %s', v_player1_name)
        );

        -- Marcheaza XP ca fiind acordat
        NEW.xp_awarded := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creeaza trigger pentru finalizare meci
DROP TRIGGER IF EXISTS handle_match_completion_trigger ON matches;
CREATE TRIGGER handle_match_completion_trigger
    BEFORE UPDATE OF winner_id ON matches
    FOR EACH ROW
    EXECUTE FUNCTION handle_match_completion();

-- Functie pentru acordare XP pentru activitati de solicitare de partner
CREATE OR REPLACE FUNCTION handle_partner_request_response()
RETURNS TRIGGER AS $$
DECLARE
    v_creator_id UUID;
    v_creator_name TEXT;
    v_responder_name TEXT;
BEGIN
    -- Doar daca statusul se schimba in 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        -- Obtine ID-ul creatorului si numele
        SELECT mr.creator_id, p1.full_name, p2.full_name 
        INTO v_creator_id, v_creator_name, v_responder_name
        FROM match_requests mr
        JOIN profiles p1 ON p1.id = mr.creator_id
        JOIN profiles p2 ON p2.id = NEW.responder_id
        WHERE mr.id = NEW.request_id;

        -- Acorda XP pentru ambii creator si raspunsitor
        PERFORM award_xp(
            v_creator_id,
            'partner_request',
            format('Match request accepted by %s', v_responder_name)
        );

        PERFORM award_xp(
            NEW.responder_id,
            'partner_request',
            format('Accepted match request from %s', v_creator_name)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creeaza trigger pentru raspunsuri la solicitari de partner
DROP TRIGGER IF EXISTS handle_partner_request_response_trigger ON match_request_responses;
CREATE TRIGGER handle_partner_request_response_trigger
    BEFORE UPDATE OF status ON match_request_responses
    FOR EACH ROW
    EXECUTE FUNCTION handle_partner_request_response();

-- Actualizeaza meciurile existente care au castigator dar nu au XP acordat
UPDATE matches
SET xp_awarded = true
WHERE winner_id IS NOT NULL AND NOT xp_awarded;
