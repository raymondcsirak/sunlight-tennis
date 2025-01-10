-- Enable RLS on match_request_responses table if not already enabled
do $$ 
begin
  if not exists (
    select 1 from pg_tables 
    where schemaname = 'public' 
    and tablename = 'match_request_responses' 
    and rowsecurity = true
  ) then
    alter table "public"."match_request_responses" enable row level security;
  end if;
end $$;

-- Drop existing policies if they exist
drop policy if exists "Users can view responses for their requests" on "public"."match_request_responses";
drop policy if exists "Users can view their own responses" on "public"."match_request_responses";
drop policy if exists "Users can create responses" on "public"."match_request_responses";
drop policy if exists "Users can update their own responses" on "public"."match_request_responses";

-- Policy to allow users to view responses for their requests
create policy "Users can view responses for their requests"
on "public"."match_request_responses"
for select
to authenticated
using (
  auth.uid() in (
    select creator_id 
    from match_requests 
    where id = request_id
  )
);

-- Policy to allow users to view their own responses
create policy "Users can view their own responses"
on "public"."match_request_responses"
for select
to authenticated
using (auth.uid() = responder_id);

-- Policy to allow users to create responses
create policy "Users can create responses"
on "public"."match_request_responses"
for insert
to authenticated
with check (auth.uid() = responder_id);

-- Policy to allow users to update their own responses or responses to their requests
create policy "Users can update their own responses"
on "public"."match_request_responses"
for update
to authenticated
using (
  auth.uid() = responder_id or
  auth.uid() in (
    select creator_id 
    from match_requests 
    where id = request_id
  )
);
