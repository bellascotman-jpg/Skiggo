-- Quotes always begin as pending; clients cannot forge accepted/declined/withdrawn quote states.
revoke insert on public.service_quotes from anon, authenticated;
grant insert (request_id, provider_id, amount_minor, currency, message, estimated_days)
  on public.service_quotes to authenticated;
