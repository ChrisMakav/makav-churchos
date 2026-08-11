-- MAKAV ChurchOS — Incrément 6 : Dons / Dîmes + reçus

create table donation_funds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  is_restricted boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index donation_funds_org_name_uq on donation_funds (organization_id, lower(name));

create table donations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  member_id uuid references members(id) on delete set null,
  fund_id uuid not null references donation_funds(id),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null,
  method text not null check (method in ('cash', 'check', 'transfer', 'card', 'mobile_money')),
  given_at date not null,
  is_anonymous boolean not null default false,
  receipt_number text,
  receipt_issued_at timestamptz,
  transaction_id uuid references transactions(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index donations_organization_id_idx on donations (organization_id);
create unique index donations_org_receipt_uq on donations (organization_id, receipt_number) where receipt_number is not null;

-- Numérotation séquentielle sans trou, par organisation et par année civile —
-- exigence légale pour un reçu de don valide. `receipt_counters` + incrément
-- atomique via upsert (jamais un count(*), non sûr sous écritures concurrentes).
create table receipt_counters (
  organization_id uuid not null references organizations(id) on delete cascade,
  year integer not null,
  last_number integer not null default 0,
  primary key (organization_id, year)
);

alter table donation_funds enable row level security;
alter table donations enable row level security;
alter table receipt_counters enable row level security;

create policy donation_funds_select on donation_funds for select
  to authenticated using (is_org_member(organization_id));
create policy donation_funds_write on donation_funds for all
  to authenticated
  using (is_org_member(organization_id) and has_permission(organization_id, 'donations.write'))
  with check (has_permission(organization_id, 'donations.write'));

create policy donations_select on donations for select
  to authenticated using (is_org_member(organization_id));

-- Pas de policy insert/update client : les dons passent uniquement par la RPC
-- create_donation ci-dessous, pour garantir l'atomicité don+transaction+reçu.

create policy receipt_counters_select on receipt_counters for select
  to authenticated using (is_org_member(organization_id));

create function next_receipt_number(target_org_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year integer := extract(year from now());
  next_num integer;
begin
  insert into receipt_counters (organization_id, year, last_number)
  values (target_org_id, current_year, 1)
  on conflict (organization_id, year)
    do update set last_number = receipt_counters.last_number + 1
  returning last_number into next_num;

  return current_year || '-' || lpad(next_num::text, 5, '0');
end;
$$;

-- Crée le don, poste automatiquement la transaction correspondante et attribue
-- un numéro de reçu — le tout de façon atomique (SECURITY DEFINER, transaction
-- SQL implicite d'une fonction plpgsql).
create function create_donation(
  target_org_id uuid,
  target_site_id uuid,
  target_account_id uuid,
  target_fund_id uuid,
  target_member_id uuid,
  target_amount numeric,
  target_currency text,
  target_method text,
  target_given_at date,
  target_is_anonymous boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  donations_category_id uuid;
  new_transaction_id uuid;
  new_donation_id uuid;
  new_receipt_number text;
  fund_name text;
begin
  if not has_permission(target_org_id, 'donations.write') then
    raise exception 'Permission refusée';
  end if;

  select id into donations_category_id
  from transaction_categories
  where organization_id = target_org_id and kind = 'income' and lower(name) = 'dons'
  limit 1;

  if donations_category_id is null then
    raise exception 'Catégorie comptable "Dons" introuvable pour cette organisation';
  end if;

  select name into fund_name from donation_funds where id = target_fund_id;

  insert into transactions (
    organization_id, site_id, account_id, category_id, type, amount, currency,
    occurred_on, description, created_by
  ) values (
    target_org_id, target_site_id, target_account_id, donations_category_id, 'income',
    target_amount, target_currency, target_given_at, coalesce(fund_name, 'Don'), auth.uid()
  )
  returning id into new_transaction_id;

  new_receipt_number := next_receipt_number(target_org_id);

  insert into donations (
    organization_id, site_id, member_id, fund_id, amount, currency, method,
    given_at, is_anonymous, receipt_number, receipt_issued_at, transaction_id, created_by
  ) values (
    target_org_id, target_site_id, target_member_id, target_fund_id, target_amount, target_currency,
    target_method, target_given_at, target_is_anonymous, new_receipt_number, now(), new_transaction_id, auth.uid()
  )
  returning id into new_donation_id;

  return new_donation_id;
end;
$$;

-- Fonds par défaut, même pattern que les catégories/types d'événements.
create function seed_default_donation_funds(target_org_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into donation_funds (organization_id, name, is_restricted) values
    (target_org_id, 'Dîme', false),
    (target_org_id, 'Offrande', false),
    (target_org_id, 'Missions', false)
  on conflict (organization_id, lower(name)) do nothing;
$$;

select seed_default_donation_funds(id) from organizations;

create or replace function create_organization(
  org_name text,
  org_timezone text default 'Africa/Douala',
  org_currency text default 'XAF'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  new_site_id uuid;
  admin_role_id uuid;
  org_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  org_slug := lower(regexp_replace(trim(org_name), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substr(md5(random()::text), 1, 6);

  insert into organizations (name, slug, timezone, currency)
  values (org_name, org_slug, org_timezone, org_currency)
  returning id into new_org_id;

  insert into sites (organization_id, type, name)
  values (new_org_id, 'church', org_name)
  returning id into new_site_id;

  select id into admin_role_id from roles where code = 'org_admin' and organization_id is null;

  insert into memberships (organization_id, user_id, site_id, role_id, status)
  values (new_org_id, auth.uid(), new_site_id, admin_role_id, 'active');

  perform seed_default_event_types(new_org_id);
  perform seed_default_transaction_categories(new_org_id);
  perform seed_default_donation_funds(new_org_id);

  return new_org_id;
end;
$$;
