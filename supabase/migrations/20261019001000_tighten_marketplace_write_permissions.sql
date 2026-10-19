-- Tighten client writes so verification and workflow statuses cannot be self-assigned.
revoke insert on public.provider_profiles from anon, authenticated;
grant insert (id, business_name, bio, years_experience, service_area_text, accepts_requests)
  on public.provider_profiles to authenticated;

revoke insert on public.service_requests from anon, authenticated;
grant insert (customer_id, category_id, title, description, location_area, budget_min_minor, budget_max_minor, currency, service_mode, desired_at)
  on public.service_requests to authenticated;

-- Quote acceptance must be an atomic server-side workflow that also awards the request and closes competing quotes.
-- Until that workflow is implemented, clients may submit and read quotes but cannot mutate quote status.
drop policy if exists quotes_provider_withdraw_pending on public.service_quotes;
drop policy if exists quotes_customer_decide_pending on public.service_quotes;
revoke update on public.service_quotes from anon, authenticated;
