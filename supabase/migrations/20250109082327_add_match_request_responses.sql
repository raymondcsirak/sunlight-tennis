-- Sistem de cereri pentru meciuri
-- Implementeaza:
-- - Tabelul pentru cereri de meci
-- - Sistem de raspunsuri la cereri (acceptare/respingere)
-- - Notificari pentru actualizari status
-- - Creare automata meci la acceptare

-- Creeaza tipul de enum pentru statusul de raspuns daca nu exista
DO $$ BEGIN
    CREATE TYPE match_response_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Creeaza tabelul pentru raspunsuri la cereri de meci
CREATE TABLE IF NOT EXISTS match_request_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES match_requests(id) ON DELETE CASCADE,
    responder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status match_response_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, responder_id)
);

-- Activeaza RLS
ALTER TABLE match_request_responses ENABLE ROW LEVEL SECURITY;

-- Politici pentru raspunsuri la cereri de meci
DO $$ BEGIN
    CREATE POLICY "Users can view responses for their requests"
        ON match_request_responses FOR SELECT
        USING (
            request_id IN (
                SELECT id FROM match_requests WHERE creator_id = auth.uid()
            ) OR
            responder_id = auth.uid()
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create responses"
        ON match_request_responses FOR INSERT
        WITH CHECK (
            responder_id = auth.uid() AND
            request_id IN (
                SELECT id FROM match_requests 
                WHERE status = 'open' 
                AND creator_id != auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own responses"
        ON match_request_responses FOR UPDATE
        USING (responder_id = auth.uid())
        WITH CHECK (responder_id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Creeaza trigger pentru actualizarea updated_at
DO $$ BEGIN
    CREATE TRIGGER update_match_request_responses_updated_at
        BEFORE UPDATE ON match_request_responses
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 