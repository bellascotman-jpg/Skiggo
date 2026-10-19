create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', phone text, avatar_url text,
 account_type text not null default 'customer' check (account_type in ('customer','provider')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.service_categories (
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
 description text not null default '', examples text[] not null default '{}',
 sort_order integer not null default 0, is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.provider_profiles (
 id uuid primary key references public.profiles(id) on delete cascade,
 business_name text not null, bio text not null default '',
 years_experience integer not null default 0 check (years_experience between 0 and 100),
 service_area_text text not null default '',
 verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
 accepts_requests boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.service_listings (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references public.provider_profiles(id) on delete cascade,
 category_id uuid not null references public.service_categories(id),
 title text not null check (char_length(trim(title)) between 3 and 120),
 description text not null check (char_length(trim(description)) between 10 and 5000),
 pricing_type text not null default 'quote' check (pricing_type in ('fixed','starting_at','quote')),
 price_minor bigint check (price_minor is null or price_minor >= 0),
 currency text not null default 'NGN' check (currency ~ '^[A-Z]{3}$'),
 delivery_mode text not null default 'onsite' check (delivery_mode in ('onsite','remote','both')),
 status text not null default 'draft' check (status in ('draft','published','paused','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint service_listing_price_required check (
  (pricing_type='quote' and price_minor is null) or (pricing_type in ('fixed','starting_at') and price_minor is not null)
 )
);
create table if not exists public.service_requests (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references public.profiles(id) on delete restrict,
 category_id uuid not null references public.service_categories(id),
 title text not null check (char_length(trim(title)) between 3 and 120),
 description text not null check (char_length(trim(description)) between 10 and 5000),
 location_area text not null default '',
 budget_min_minor bigint check (budget_min_minor is null or budget_min_minor >= 0),
 budget_max_minor bigint check (budget_max_minor is null or budget_max_minor >= 0),
 currency text not null default 'NGN' check (currency ~ '^[A-Z]{3}$'),
 service_mode text not null default 'onsite' check (service_mode in ('onsite','remote','both')),
 desired_at timestamptz,
 status text not null default 'open' check (status in ('open','awarded','cancelled','completed','closed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint service_request_budget_order check (budget_min_minor is null or budget_max_minor is null or budget_min_minor <= budget_max_minor)
);
create table if not exists public.service_quotes (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.service_requests(id) on delete cascade,
 provider_id uuid not null references public.provider_profiles(id) on delete restrict,
 amount_minor bigint not null check (amount_minor >= 0),
 currency text not null default 'NGN' check (currency ~ '^[A-Z]{3}$'),
 message text not null check (char_length(trim(message)) between 5 and 3000),
 estimated_days integer check (estimated_days is null or estimated_days between 0 and 3650),
 status text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique (request_id,provider_id)
);

create index if not exists service_listings_public_search_idx on public.service_listings(category_id,status,created_at desc);
create index if not exists service_listings_provider_idx on public.service_listings(provider_id,status);
create index if not exists service_requests_open_search_idx on public.service_requests(category_id,status,created_at desc);
create index if not exists service_requests_customer_idx on public.service_requests(customer_id,created_at desc);
create index if not exists service_quotes_request_idx on public.service_quotes(request_id,status,created_at desc);
create index if not exists service_quotes_provider_idx on public.service_quotes(provider_id,created_at desc);

insert into public.service_categories(slug,name,description,examples,sort_order) values
('home-repairs','Home repairs','Repairs and improvements around your home.',array['Plumbing','Carpentry','Handyman'],10),
('electrical-solar','Electrical & solar','Electrical work, installations and solar support.',array['Electricians','Solar installation','Inverters'],20),
('cleaning-domestic','Cleaning & domestic','Keep your home or workplace clean and organised.',array['Home cleaning','Office cleaning','Laundry'],30),
('automotive','Automotive','Vehicle maintenance, repairs and care.',array['Mechanics','Auto electricians','Car wash'],40),
('moving-delivery','Moving, delivery & errands','Help with moving items, deliveries and everyday tasks.',array['Moving help','Dispatch','Errands'],50),
('beauty-personal-care','Beauty & personal care','Personal grooming and beauty services.',array['Barbers','Hair styling','Makeup'],60),
('education-tutoring','Education & tutoring','Learn a subject or build a practical skill.',array['Home tutors','Exam preparation','Music lessons'],70),
('digital-creative','Digital & creative','Creative, technical and online business support.',array['Web design','Graphic design','IT support'],80),
('business-services','Business services','Professional support for businesses and teams.',array['Bookkeeping','Admin support','Consulting'],90),
('events','Events','People and services to bring your event together.',array['Catering','Photography','Event planning'],100),
('fashion-tailoring','Fashion & tailoring','Clothing alterations, tailoring and fashion services.',array['Tailoring','Alterations','Fashion design'],110),
('repairs-maintenance','Repairs & maintenance','Repair and maintain appliances, equipment and property.',array['Appliance repair','AC servicing','Painting'],120),
('safety-specialist','Safety & specialist services','Specialist help where skills and trust matter.',array['Safety inspections','Technical support','Specialist trades'],130)
on conflict(slug) do update set name=excluded.name,description=excluded.description,examples=excluded.examples,sort_order=excluded.sort_order;

create or replace function private.handle_new_skiggo_user()
returns trigger language plpgsql security definer set search_path=''
as $function$
declare requested_type text;
begin
 requested_type := case when new.raw_user_meta_data->>'account_type'='provider' then 'provider' else 'customer' end;
 insert into public.profiles(id,full_name,account_type)
 values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),''),requested_type)
 on conflict(id) do nothing;
 return new;
end;
$function$;
revoke all on function private.handle_new_skiggo_user() from public,anon,authenticated;
drop trigger if exists on_auth_user_created_skiggo on auth.users;
create trigger on_auth_user_created_skiggo after insert on auth.users for each row execute function private.handle_new_skiggo_user();

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path=''
as $function$ begin new.updated_at:=now(); return new; end; $function$;
revoke all on function private.set_updated_at() from public,anon,authenticated;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
drop trigger if exists provider_profiles_set_updated_at on public.provider_profiles;
create trigger provider_profiles_set_updated_at before update on public.provider_profiles for each row execute function private.set_updated_at();
drop trigger if exists service_listings_set_updated_at on public.service_listings;
create trigger service_listings_set_updated_at before update on public.service_listings for each row execute function private.set_updated_at();
drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at before update on public.service_requests for each row execute function private.set_updated_at();
drop trigger if exists service_quotes_set_updated_at on public.service_quotes;
create trigger service_quotes_set_updated_at before update on public.service_quotes for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.service_listings enable row level security;
alter table public.service_requests enable row level security;
alter table public.service_quotes enable row level security;

grant usage on schema public to anon,authenticated;
grant select on public.service_categories,public.provider_profiles,public.service_listings to anon,authenticated;
grant select,update on public.profiles to authenticated;
grant insert,select,update on public.provider_profiles,public.service_listings,public.service_requests,public.service_quotes to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid())=id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
revoke insert,delete,update on public.profiles from anon,authenticated;
grant update(full_name,phone,avatar_url) on public.profiles to authenticated;

drop policy if exists categories_read_active on public.service_categories;
create policy categories_read_active on public.service_categories for select to anon,authenticated using(is_active=true);

drop policy if exists provider_profiles_read on public.provider_profiles;
create policy provider_profiles_read on public.provider_profiles for select to anon,authenticated using(id=(select auth.uid()) or verification_status='verified');
drop policy if exists provider_profiles_insert_own on public.provider_profiles;
create policy provider_profiles_insert_own on public.provider_profiles for insert to authenticated with check (
 id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.account_type='provider')
);
drop policy if exists provider_profiles_update_own on public.provider_profiles;
create policy provider_profiles_update_own on public.provider_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
revoke update,delete on public.provider_profiles from anon,authenticated;
grant update(business_name,bio,years_experience,service_area_text,accepts_requests) on public.provider_profiles to authenticated;

drop policy if exists listings_read_published_verified on public.service_listings;
create policy listings_read_published_verified on public.service_listings for select to anon,authenticated using (
 (status='published' and exists(select 1 from public.provider_profiles pp where pp.id=provider_id and pp.verification_status='verified' and pp.accepts_requests=true))
 or provider_id=(select auth.uid())
);
drop policy if exists listings_insert_own on public.service_listings;
create policy listings_insert_own on public.service_listings for insert to authenticated with check (
 provider_id=(select auth.uid()) and exists(select 1 from public.provider_profiles pp where pp.id=(select auth.uid()))
 and (status<>'published' or exists(select 1 from public.provider_profiles pp where pp.id=(select auth.uid()) and pp.verification_status='verified'))
);
drop policy if exists listings_update_own on public.service_listings;
create policy listings_update_own on public.service_listings for update to authenticated using(provider_id=(select auth.uid())) with check (
 provider_id=(select auth.uid()) and (status<>'published' or exists(select 1 from public.provider_profiles pp where pp.id=(select auth.uid()) and pp.verification_status='verified'))
);
revoke delete on public.service_listings from anon,authenticated;

drop policy if exists requests_read_customer_or_verified_provider on public.service_requests;
create policy requests_read_customer_or_verified_provider on public.service_requests for select to authenticated using (
 customer_id=(select auth.uid()) or (status='open' and exists(select 1 from public.provider_profiles pp where pp.id=(select auth.uid()) and pp.verification_status='verified'))
);
drop policy if exists requests_insert_own on public.service_requests;
create policy requests_insert_own on public.service_requests for insert to authenticated with check(customer_id=(select auth.uid()));
drop policy if exists requests_update_own_open on public.service_requests;
create policy requests_update_own_open on public.service_requests for update to authenticated using(customer_id=(select auth.uid()) and status='open') with check(customer_id=(select auth.uid()) and status='open');
revoke delete,update on public.service_requests from anon,authenticated;
grant update(category_id,title,description,location_area,budget_min_minor,budget_max_minor,currency,service_mode,desired_at) on public.service_requests to authenticated;

drop policy if exists quotes_read_parties on public.service_quotes;
create policy quotes_read_parties on public.service_quotes for select to authenticated using (
 provider_id=(select auth.uid()) or exists(select 1 from public.service_requests sr where sr.id=request_id and sr.customer_id=(select auth.uid()))
);
drop policy if exists quotes_insert_verified_provider on public.service_quotes;
create policy quotes_insert_verified_provider on public.service_quotes for insert to authenticated with check (
 provider_id=(select auth.uid()) and exists(select 1 from public.provider_profiles pp where pp.id=(select auth.uid()) and pp.verification_status='verified')
 and exists(select 1 from public.service_requests sr where sr.id=request_id and sr.status='open' and sr.customer_id<>(select auth.uid()))
);
drop policy if exists quotes_provider_withdraw_pending on public.service_quotes;
create policy quotes_provider_withdraw_pending on public.service_quotes for update to authenticated using(provider_id=(select auth.uid()) and status='pending') with check(provider_id=(select auth.uid()) and status='withdrawn');
drop policy if exists quotes_customer_decide_pending on public.service_quotes;
create policy quotes_customer_decide_pending on public.service_quotes for update to authenticated using (
 status='pending' and exists(select 1 from public.service_requests sr where sr.id=request_id and sr.customer_id=(select auth.uid()))
) with check (
 status in ('accepted','declined') and exists(select 1 from public.service_requests sr where sr.id=request_id and sr.customer_id=(select auth.uid()))
);
revoke delete,update on public.service_quotes from anon,authenticated;
grant update(status) on public.service_quotes to authenticated;

-- If this project has the optional helper, remove direct API execution while leaving its event trigger registered.
do $block$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$block$;
