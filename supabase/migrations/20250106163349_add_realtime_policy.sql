-- Activare realtime pentru tabelul notificari daca nu este deja activat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END
$$;

-- Adaugare politica pentru realtime
BEGIN;
  ALTER TABLE notifications REPLICA IDENTITY FULL;
COMMIT; 