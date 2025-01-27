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
  -- Get the request id
  SELECT request_id INTO v_request_id
  FROM match_request_responses
  WHERE id = p_response_id;

  -- Update the response status to rejected
  UPDATE match_request_responses
  SET status = 'rejected'
  WHERE id = p_response_id;

  -- Check if there are any other pending responses
  SELECT COUNT(*) INTO v_other_pending_responses
  FROM match_request_responses
  WHERE request_id = v_request_id
  AND status = 'pending'
  AND id != p_response_id;

  -- If no other pending responses, set request back to open
  IF v_other_pending_responses = 0 THEN
    UPDATE match_requests 
    SET status = 'open'
    WHERE id = v_request_id;
  END IF;
END;
$function$;