CREATE OR REPLACE FUNCTION handle_match_request_rejection(
  p_response_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_request_id uuid;
  v_other_pending_responses int;
BEGIN
 -- Obtinem id-ul cererii
  SELECT request_id INTO v_request_id
  FROM match_request_responses
  WHERE id = p_response_id;

  -- Actualizam statusul raspunsului la rejected
  UPDATE match_request_responses
  SET status = 'rejected'
  WHERE id = p_response_id;

  -- Verificam daca exista alte raspunsuri in asteptare
  SELECT COUNT(*) INTO v_other_pending_responses
  FROM match_request_responses
  WHERE request_id = v_request_id
  AND status = 'pending'
  AND id != p_response_id;

  -- Daca nu exista alte raspunsuri in asteptare, setam cererea inapoi la open
  IF v_other_pending_responses = 0 THEN
    UPDATE match_requests 
    SET status = 'open'
    WHERE id = v_request_id;
  END IF;
END;
$function$;