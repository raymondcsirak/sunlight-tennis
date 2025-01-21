-- Activare RLS pe tabelul match_request_responses daca nu este deja activat
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

-- Stergere politici existente daca exista
drop policy if exists "Users can view responses for their requests" on "public"."match_request_responses";
drop policy if exists "Users can view their own responses" on "public"."match_request_responses";
drop policy if exists "Users can create responses" on "public"."match_request_responses";
drop policy if exists "Users can update their own responses" on "public"."match_request_responses";

-- Politica pentru vizualizare raspunsuri pentru cererile proprii
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

-- Politica pentru vizualizare raspunsuri proprii
create policy "Users can view their own responses"
on "public"."match_request_responses"
for select
to authenticated
using (auth.uid() = responder_id);

-- Politica pentru creare raspunsuri
create policy "Users can create responses"
on "public"."match_request_responses"
for insert
to authenticated
with check (auth.uid() = responder_id);

-- Politica pentru actualizare raspunsuri proprii sau raspunsuri catre cererile proprii
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
