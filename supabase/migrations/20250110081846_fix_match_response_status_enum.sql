-- Creare un nou tip de enum pentru statusul raspunsurilor cererilor de match
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'match_request_response_status') then
    create type match_request_response_status as enum ('pending', 'accepted', 'rejected');
  end if;
end $$;

-- Stergere valoare default
alter table "public"."match_request_responses" 
  alter column status drop default;

-- Convertire in text
alter table "public"."match_request_responses" 
  alter column status type text;

-- Convertire in nou tip de enum
alter table "public"."match_request_responses" 
  alter column status type match_request_response_status 
  using status::match_request_response_status;

-- Setare noua valoare default
alter table "public"."match_request_responses" 
  alter column status set default 'pending'::match_request_response_status;