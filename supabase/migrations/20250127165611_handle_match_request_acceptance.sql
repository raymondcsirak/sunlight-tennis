CREATE OR REPLACE FUNCTION public.handle_match_request_acceptance(
  p_request_id uuid, 
  p_responder_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_response_id UUID;
  v_request_status text;
BEGIN
  -- Check current request status
  SELECT status INTO v_request_status
  FROM match_requests
  WHERE id = p_request_id;

  -- Only proceed if request is open
  IF v_request_status != 'open' THEN
    RAISE EXCEPTION 'Request is no longer open for responses';
  END IF;

  -- Create new response with pending status
  INSERT INTO match_request_responses (
    request_id,
    responder_id,
    status
  )
  VALUES (
    p_request_id,
    p_responder_id,
    'pending'
  )
  RETURNING id INTO v_response_id;

  -- Update request status to pending
  UPDATE match_requests 
  SET status = 'pending'
  WHERE id = p_request_id;

  -- Return the response id
  RETURN json_build_object('id', v_response_id);
END;
$function$;