-- MAKAV ChurchOS — Incrément 4 : Événements + Calendrier

create table event_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  label_fr text not null,
  color text not null default '#c2653c',
  unique (organization_id, code)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  department_id uuid references departments(id) on delete set null,
  event_type_id uuid not null references event_types(id),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  capacity integer,
  status text not null default 'scheduled', -- scheduled|cancelled|completed
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint events_ends_after_starts check (ends_at >= starts_at)
);

create index events_organization_id_idx on events (organization_id);
create index events_starts_at_idx on events (starts_at);

alter table event_types enable row level security;
alter table events enable row level security;

create policy event_types_select on event_types for select
  to authenticated using (is_org_member(organization_id));
create policy event_types_write on event_types for all
  to authenticated
  using (is_org_member(organization_id) and has_permission(organization_id, 'events.write'))
  with check (has_permission(organization_id, 'events.write'));

create policy events_select on events for select
  to authenticated using (is_org_member(organization_id));
create policy events_insert on events for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'events.write'));
create policy events_update on events for update
  to authenticated using (is_org_member(organization_id)) with check (has_permission(organization_id, 'events.write'));
create policy events_delete on events for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'events.write'));

-- Types d'événements par défaut, palette alignée sur les tokens du design
-- system (docs/architecture/design-system.md).
create function seed_default_event_types(target_org_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into event_types (organization_id, code, label_fr, color) values
    (target_org_id, 'culte', 'Culte', '#c2653c'),
    (target_org_id, 'reunion', 'Réunion', '#5b4358'),
    (target_org_id, 'formation', 'Formation', '#7c8b63'),
    (target_org_id, 'repetition', 'Répétition', '#c99a3e')
  on conflict (organization_id, code) do nothing;
$$;

-- Rattrape les organisations déjà créées avant cet incrément.
select seed_default_event_types(id) from organizations;

-- Étend create_organization (incrément 1) pour seeder les types par défaut.
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

  return new_org_id;
end;
$$;
