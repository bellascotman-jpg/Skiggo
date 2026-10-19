drop policy if exists requests_insert_own on public.service_requests;
create policy requests_insert_own on public.service_requests
for insert to authenticated
with check (
  customer_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.account_type = 'customer'
  )
);
