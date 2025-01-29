-- Reparare statusul cererilor de meci in functie de meciurile completate
CREATE OR REPLACE FUNCTION handle_match_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Daca statusul meciului a fost schimbat in completat
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Actualizeaza statusul corespunzator cererii de meci
    UPDATE match_requests
    SET status = 'confirmed'
    WHERE id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creeaza un trigger pentru meciuri completate
CREATE TRIGGER handle_match_completion_trigger
  AFTER UPDATE OF status ON matches
  FOR EACH ROW
  EXECUTE FUNCTION handle_match_completion();

-- Reparare date existente
UPDATE match_requests mr
SET status = 'confirmed'
WHERE EXISTS (
  SELECT 1 FROM matches m
  WHERE m.request_id = mr.id
  AND m.status = 'completed'
);