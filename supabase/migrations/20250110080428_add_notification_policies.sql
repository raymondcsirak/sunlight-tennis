-- Activare RLS pe tabelul notifications daca nu este deja activat
do $$ 
begin
  if not exists (
    select 1 from pg_tables 
    where schemaname = 'public' 
    and tablename = 'notifications' 
    and rowsecurity = true
  ) then
    alter table "public"."notifications" enable row level security;
  end if;
end $$;

-- Stergere politici existente daca exista
drop policy if exists "Users can view their own notifications" on "public"."notifications";
drop policy if exists "Users can create notifications" on "public"."notifications";
drop policy if exists "Users can delete their own notifications" on "public"."notifications";

-- Politica pentru vizualizare notificari proprii
create policy "Users can view their own notifications"
on "public"."notifications"
for select
to authenticated
using (auth.uid() = user_id);

-- Politica pentru creare notificari pentru orice user
-- Este necesar deoarece utilizatorii trebuie sa poata trimite notificari catre alte utilizatori
create policy "Users can create notifications"
on "public"."notifications"
for insert
to authenticated
with check (true);

-- Politica pentru stergere notificari proprii
create policy "Users can delete their own notifications"
on "public"."notifications"
for delete
to authenticated
using (auth.uid() = user_id);
