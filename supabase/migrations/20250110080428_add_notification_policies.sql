-- Enable RLS on notifications table if not already enabled
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

-- Drop existing policies if they exist
drop policy if exists "Users can view their own notifications" on "public"."notifications";
drop policy if exists "Users can create notifications" on "public"."notifications";
drop policy if exists "Users can delete their own notifications" on "public"."notifications";

-- Policy to allow users to view their own notifications
create policy "Users can view their own notifications"
on "public"."notifications"
for select
to authenticated
using (auth.uid() = user_id);

-- Policy to allow users to create notifications for any user
-- This is needed because users need to be able to send notifications to other users
create policy "Users can create notifications"
on "public"."notifications"
for insert
to authenticated
with check (true);

-- Policy to allow users to delete their own notifications
create policy "Users can delete their own notifications"
on "public"."notifications"
for delete
to authenticated
using (auth.uid() = user_id);
