-- MAKAV ChurchOS — Incrément 1 : tenancy + RBAC
-- Fondation dont dépend chaque politique RLS ultérieure (organizations, sites,
-- profiles, memberships, roles, permissions) + fonctions et RPC de bootstrap.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Organisations & hiérarchie de sites (Organisation → Région → Église → Campus)
-- ---------------------------------------------------------------------------

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  currency text not null default 'XAF',
  timezone text not null default 'Africa/Douala',
  plan text not null default 'starter',
  created_at timestamptz not null default now()
);

create type site_type as enum ('region', 'church', 'campus');

create table sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  parent_site_id uuid references sites(id) on delete cascade,
  type site_type not null default 'church',
  name text not null,
  address text,
  city text,
  country text,
  timezone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index sites_organization_id_idx on sites (organization_id);

-- P1 ne crée que des sites de type "church" sans parent. Ce trigger garde la
-- hiérarchie valide dès maintenant pour ne pas bloquer les régions/campus (P2/P3) :
--   region : pas de parent
--   church : sans parent (siège autonome) ou rattachée à une région
--   campus : doit être rattaché à une église
create function validate_site_hierarchy()
returns trigger
language plpgsql
as $$
declare
  parent_type site_type;
begin
  if new.parent_site_id is null then
    if new.type = 'campus' then
      raise exception 'Un site de type campus doit avoir une église parente';
    end if;
    return new;
  end if;

  select type into parent_type from sites where id = new.parent_site_id;

  if new.type = 'region' then
    raise exception 'Un site de type région ne peut pas avoir de parent';
  elsif new.type = 'church' and parent_type <> 'region' then
    raise exception 'Un site de type église ne peut avoir qu''une région pour parent';
  elsif new.type = 'campus' and parent_type <> 'church' then
    raise exception 'Un site de type campus ne peut avoir qu''une église pour parent';
  end if;

  return new;
end;
$$;

create trigger sites_validate_hierarchy
  before insert or update on sites
  for each row execute function validate_site_hierarchy();

-- ---------------------------------------------------------------------------
-- 2. Profils (miroir de auth.users)
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  locale text not null default 'fr',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Catalogue RBAC (rôles, permissions)
-- ---------------------------------------------------------------------------

create table roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  code text not null,
  label_fr text not null,
  is_system boolean not null default true,
  unique (organization_id, code)
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Catalogue complet des 11 rôles système du cahier des charges (section 28),
-- même si seuls 6 sont proposés à l'onboarding P1 (voir docs/architecture/rbac.md).
insert into roles (code, label_fr, is_system) values
  ('super_admin', 'Super administrateur', true),
  ('org_admin', 'Administrateur d''église', true),
  ('pastor', 'Pasteur (principal / adjoint)', true),
  ('finance_manager', 'Responsable financier / Trésorier', true),
  ('dept_head', 'Responsable de département / groupe / événement', true),
  ('member', 'Membre', true),
  ('visitor', 'Visiteur', true),
  ('volunteer_manager', 'Responsable RH / bénévoles', true),
  ('communications_manager', 'Responsable communication', true),
  ('technical_manager', 'Responsable technique', true),
  ('hr_manager', 'Responsable administratif', true);

-- Codes de permission au format module.ressource.action — mirror TypeScript
-- dans lib/rbac/permissions.ts. Étendre ce catalogue à chaque nouveau module
-- (voir la checklist dans docs/architecture/rbac.md).
insert into permissions (code, description) values
  ('organization.manage', 'Gérer les paramètres de l''organisation'),
  ('organization.manage_members', 'Inviter et gérer les membres de l''organisation'),
  ('members.read', 'Consulter les membres'),
  ('members.write', 'Créer/modifier les membres'),
  ('families.read', 'Consulter les familles'),
  ('families.write', 'Créer/modifier les familles'),
  ('departments.read', 'Consulter les départements'),
  ('departments.write', 'Créer/modifier les départements'),
  ('events.read', 'Consulter les événements'),
  ('events.write', 'Créer/modifier les événements'),
  ('finance.accounts.read', 'Consulter les comptes'),
  ('finance.accounts.write', 'Créer/modifier les comptes'),
  ('finance.transactions.read', 'Consulter les transactions'),
  ('finance.transactions.write', 'Créer/modifier les transactions'),
  ('finance.expenses.read', 'Consulter les dépenses'),
  ('finance.expenses.write', 'Créer/modifier les dépenses'),
  ('finance.expenses.approve', 'Approuver/rejeter les dépenses'),
  ('donations.read', 'Consulter les dons'),
  ('donations.write', 'Enregistrer des dons'),
  ('budgets.read', 'Consulter les budgets'),
  ('budgets.write', 'Créer/modifier les budgets'),
  ('budgets.approve', 'Approuver les budgets'),
  ('notifications.read', 'Consulter ses notifications');

-- Attribution des permissions aux 6 rôles câblés en P1. super_admin/org_admin
-- reçoivent tout ; pastor/finance_manager/dept_head reçoivent un sous-ensemble
-- métier ; member/visitor/les rôles non câblés n'ont aucune permission
-- d'administration (accès self-service géré hors RBAC, via user_id = auth.uid()).
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p
where r.code in ('super_admin', 'org_admin');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in (
    'members.read', 'members.write',
    'families.read', 'families.write',
    'departments.read', 'departments.write',
    'events.read', 'events.write',
    'budgets.read'
  )
where r.code = 'pastor';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in (
    'finance.accounts.read', 'finance.accounts.write',
    'finance.transactions.read', 'finance.transactions.write',
    'finance.expenses.read', 'finance.expenses.write', 'finance.expenses.approve',
    'donations.read', 'donations.write',
    'budgets.read', 'budgets.write', 'budgets.approve'
  )
where r.code = 'finance_manager';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('members.read', 'events.read', 'events.write', 'departments.write')
where r.code = 'dept_head';

-- ---------------------------------------------------------------------------
-- 4. Memberships — LA table de multi-tenancy
-- ---------------------------------------------------------------------------

create type membership_status as enum ('invited', 'active', 'suspended');

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  site_id uuid references sites(id),
  department_id uuid, -- FK vers departments(id) ajoutée à l'incrément 3
  role_id uuid not null references roles(id),
  status membership_status not null default 'active',
  invited_email text,
  created_at timestamptz not null default now(),
  constraint memberships_user_or_invite check (user_id is not null or invited_email is not null),
  unique (organization_id, user_id, role_id, site_id)
);

create index memberships_organization_id_idx on memberships (organization_id);
create index memberships_user_id_idx on memberships (user_id);

-- Empêche les invitations en double pour une même adresse tant qu'elles n'ont
-- pas été acceptées.
create unique index memberships_org_invited_email_uq
  on memberships (organization_id, lower(invited_email))
  where status = 'invited';

-- ---------------------------------------------------------------------------
-- 5. Fonctions d'aide RLS (SECURITY DEFINER STABLE — évitent la récursion RLS)
-- ---------------------------------------------------------------------------

create function is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create function has_permission(org_id uuid, perm_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    join role_permissions rp on rp.role_id = m.role_id
    join permissions p on p.id = rp.permission_id
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and p.code = perm_code
  );
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC de bootstrap (SECURITY DEFINER — seul chemin d'écriture sur memberships)
-- ---------------------------------------------------------------------------

-- Crée l'organisation + son site "église" racine + la première membership
-- (org_admin) pour l'utilisateur courant. Contourne délibérément le problème
-- d'œuf-et-poule : un nouvel utilisateur n'a encore aucune membership pour
-- satisfaire une politique RLS d'insertion classique.
create function create_organization(
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

  return new_org_id;
end;
$$;

-- Invite une personne par email avec un rôle donné. La membership reste au
-- statut 'invited' (user_id null) jusqu'à ce qu'elle crée un compte avec cet
-- email — voir le trigger handle_new_user ci-dessous qui réclame la ligne.
create function invite_member(
  target_org_id uuid,
  member_email text,
  target_role_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role_id uuid;
  new_membership_id uuid;
begin
  if not has_permission(target_org_id, 'organization.manage_members') then
    raise exception 'Permission refusée';
  end if;

  select id into target_role_id
  from roles
  where code = target_role_code and (organization_id is null or organization_id = target_org_id);

  if target_role_id is null then
    raise exception 'Rôle inconnu : %', target_role_code;
  end if;

  insert into memberships (organization_id, invited_email, role_id, status)
  values (target_org_id, lower(trim(member_email)), target_role_id, 'invited')
  returning id into new_membership_id;

  return new_membership_id;
end;
$$;

-- Change le rôle d'une membership active (réservé à organization.manage_members).
create function set_membership_role(target_membership_id uuid, target_role_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  target_role_id uuid;
begin
  select organization_id into target_org_id from memberships where id = target_membership_id;

  if target_org_id is null then
    raise exception 'Membership introuvable';
  end if;

  if not has_permission(target_org_id, 'organization.manage_members') then
    raise exception 'Permission refusée';
  end if;

  select id into target_role_id
  from roles
  where code = target_role_code and (organization_id is null or organization_id = target_org_id);

  if target_role_id is null then
    raise exception 'Rôle inconnu : %', target_role_code;
  end if;

  update memberships set role_id = target_role_id where id = target_membership_id;
end;
$$;

-- Active/suspend une membership (réservé à organization.manage_members).
create function set_membership_status(target_membership_id uuid, new_status membership_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
begin
  select organization_id into target_org_id from memberships where id = target_membership_id;

  if target_org_id is null then
    raise exception 'Membership introuvable';
  end if;

  if not has_permission(target_org_id, 'organization.manage_members') then
    raise exception 'Permission refusée';
  end if;

  update memberships set status = new_status where id = target_membership_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Bootstrap du profil + réclamation des invitations à l'inscription
-- ---------------------------------------------------------------------------

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  update memberships
  set user_id = new.id, status = 'active', invited_email = null
  where invited_email = lower(new.email) and user_id is null;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- 8. Row Level Security
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;
alter table sites enable row level security;
alter table profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table memberships enable row level security;

create policy organizations_select on organizations for select
  to authenticated
  using (is_org_member(id));

create policy organizations_update on organizations for update
  to authenticated
  using (is_org_member(id))
  with check (has_permission(id, 'organization.manage'));

create policy sites_select on sites for select
  to authenticated
  using (is_org_member(organization_id));

create policy sites_write on sites for all
  to authenticated
  using (is_org_member(organization_id) and has_permission(organization_id, 'organization.manage'))
  with check (has_permission(organization_id, 'organization.manage'));

create policy profiles_select on profiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from memberships m1
      join memberships m2 on m2.organization_id = m1.organization_id
      where m1.user_id = auth.uid() and m1.status = 'active'
        and m2.user_id = profiles.id and m2.status = 'active'
    )
  );

create policy profiles_update_self on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy roles_select on roles for select
  to authenticated
  using (organization_id is null or is_org_member(organization_id));

create policy permissions_select on permissions for select
  to authenticated
  using (true);

create policy role_permissions_select on role_permissions for select
  to authenticated
  using (true);

create policy memberships_select on memberships for select
  to authenticated
  using (user_id = auth.uid() or has_permission(organization_id, 'organization.manage_members'));
