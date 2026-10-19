-- Atomic quote acceptance: accepting a quote awards the request and declines competing pending quotes.
create or replace function private.handle_skiggo_quote_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  request_owner uuid;
  request_state text;
begin
  if old.status = 'pending' and new.status = 'accepted' then
    select sr.customer_id, sr.status
      into request_owner, request_state
      from public.service_requests sr
      where sr.id = new.request_id
      for update;

    if request_owner is null or request_owner <> auth.uid() then
      raise exception 'Only the customer who created this request can accept a quote';
    end if;
    if request_state <> 'open' then
      raise exception 'This request is no longer open for quote acceptance';
    end if;

    update public.service_requests
      set status = 'awarded', updated_at = now()
      where id = new.request_id and status = 'open';

    if not found then
      raise exception 'This request has already been awarded or closed';
    end if;

    update public.service_quotes
      set status = 'declined', updated_at = now()
      where request_id = new.request_id
        and id <> new.id
        and status = 'pending';
  end if;
  return new;
end;
$function$;

revoke all on function private.handle_skiggo_quote_transition() from public, anon, authenticated;
drop trigger if exists service_quote_transition on public.service_quotes;
create trigger service_quote_transition
  before update of status on public.service_quotes
  for each row execute function private.handle_skiggo_quote_transition();

drop policy if exists quotes_provider_withdraw_pending on public.service_quotes;
drop policy if exists quotes_customer_decide_pending on public.service_quotes;
drop policy if exists quotes_update_pending_by_party on public.service_quotes;
create policy quotes_update_pending_by_party on public.service_quotes
for update to authenticated
using (
  status = 'pending'
  and (
    provider_id = (select auth.uid())
    or exists (
      select 1 from public.service_requests sr
      where sr.id = request_id and sr.customer_id = (select auth.uid())
    )
  )
)
with check (
  (provider_id = (select auth.uid()) and status = 'withdrawn')
  or (
    status in ('accepted', 'declined')
    and exists (
      select 1 from public.service_requests sr
      where sr.id = request_id and sr.customer_id = (select auth.uid())
    )
  )
);

grant update(status) on public.service_quotes to authenticated;
