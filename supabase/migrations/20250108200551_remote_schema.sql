alter table "public"."coaches" enable row level security;

alter table "public"."training_sessions" enable row level security;

create policy "Authenticated users can delete their own coach records"
on "public"."coaches"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = id));


create policy "Authenticated users can insert new coaches"
on "public"."coaches"
as permissive
for insert
to authenticated
with check (true);


create policy "Authenticated users can update their own coach records"
on "public"."coaches"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check (true);


create policy "Authenticated users can view all coaches"
on "public"."coaches"
as permissive
for select
to authenticated
using (true);


create policy "Users can create new training sessions"
on "public"."training_sessions"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "Users can delete their own training sessions"
on "public"."training_sessions"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));


create policy "Users can update their own training sessions"
on "public"."training_sessions"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Users can view their own training sessions"
on "public"."training_sessions"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));



