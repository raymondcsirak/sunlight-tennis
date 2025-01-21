-- Activare RLS pe tabelul match_requests daca nu este deja activat
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = current_schema()
        AND c.relname = 'match_requests'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Adaugare politici RLS
DO $$ 
BEGIN
    -- Politica pentru vizualizare cereri de match
    BEGIN
        CREATE POLICY "Users can view all match requests"
            ON match_requests FOR SELECT
            USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Politica pentru creare cereri de match
    BEGIN
        CREATE POLICY "Users can create their own requests"
            ON match_requests FOR INSERT
            WITH CHECK (creator_id = auth.uid());
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Politica pentru actualizare cereri de match
    BEGIN
        CREATE POLICY "Users can update their own requests"
            ON match_requests FOR UPDATE
            USING (creator_id = auth.uid())
            WITH CHECK (creator_id = auth.uid());
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Politica pentru stergere cereri de match
    BEGIN
        CREATE POLICY "Users can delete their own requests"
            ON match_requests FOR DELETE
            USING (creator_id = auth.uid());
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;