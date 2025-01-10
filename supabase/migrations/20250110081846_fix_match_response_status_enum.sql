-- Create a new enum type for match request response status
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'match_request_response_status') then
    create type match_request_response_status as enum ('pending', 'accepted', 'rejected');
  end if;
end $$;

-- First drop the default value
alter table "public"."match_request_responses" 
  alter column status drop default;

-- Convert to text
alter table "public"."match_request_responses" 
  alter column status type text;

-- Convert to new enum type
alter table "public"."match_request_responses" 
  alter column status type match_request_response_status 
  using status::match_request_response_status;

-- Set the new default value
alter table "public"."match_request_responses" 
  alter column status set default 'pending'::match_request_response_status;
