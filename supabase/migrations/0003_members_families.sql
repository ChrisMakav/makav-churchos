-- MAKAV ChurchOS — Incrément 2 : Membres + Familles
--
-- Simplification par rapport au schéma initial du plan : une seule relation
-- members.family_id (+ members.family_role pour le lien au sein du foyer)
-- plutôt qu'un couple family_id + table de jointure family_members, qui
-- modélisait une relation many-to-many sans cas d'usage réel en P1 (un
-- membre appartient à au plus un foyer). Documenté dans data-model.md.

create table families (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  name text not null,
  head_member_id uuid, -- FK vers members(id) ajoutée plus bas (dépendance circulaire)
  created_at timestamptz not null default now()
);

create index families_organization_id_idx on families (organization_id);

create table members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  user_id uuid references auth.users(id),
  family_id uuid references families(id) on delete set null,
  family_role text, -- head|spouse|child|dependent|other — null si sans foyer
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  birth_date date,
  gender text, -- male|female|other
  member_status text not null default 'active', -- active|visitor|inactive|transferred|deceased
  join_date date,
  photo_url text,
  created_at timestamptz not null default now()
);

create index members_organization_id_idx on members (organization_id);
create index members_family_id_idx on members (family_id);
create unique index members_org_email_uq on members (organization_id, lower(email)) where email is not null;

alter table families
  add constraint families_head_member_id_fkey foreign key (head_member_id) references members(id) on delete set null;

alter table families enable row level security;
alter table members enable row level security;

create policy families_select on families for select
  to authenticated using (is_org_member(organization_id));
create policy families_insert on families for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'families.write'));
create policy families_update on families for update
  to authenticated using (is_org_member(organization_id)) with check (has_permission(organization_id, 'families.write'));
create policy families_delete on families for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'families.write'));

create policy members_select on members for select
  to authenticated using (is_org_member(organization_id));
create policy members_insert on members for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'members.write'));
create policy members_update on members for update
  to authenticated using (is_org_member(organization_id)) with check (has_permission(organization_id, 'members.write'));
create policy members_delete on members for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'members.write'));
