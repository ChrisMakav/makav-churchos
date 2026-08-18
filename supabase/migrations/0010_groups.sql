-- MAKAV ChurchOS — Groupes & Cellules
--
-- Concept distinct des départements (ministères de service — Louange,
-- Accueil...) : un groupe/cellule est une petite communauté de maison avec un
-- horaire de rencontre récurrent, un lieu et une capacité indicative. Même
-- structure de base (responsable + membres) que departments/department_members
-- (0004), volontairement dupliquée plutôt que réutilisée : les deux concepts
-- évoluent indépendamment (ex. P2 pourrait vouloir un suivi de présence par
-- cellule sans toucher aux départements).

create table groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  name text not null,
  description text,
  leader_member_id uuid references members(id) on delete set null,
  meeting_day text, -- monday|tuesday|...|sunday, nullable — voir lib/validation/groups.ts
  meeting_time time,
  location text,
  capacity integer,
  status text not null default 'active', -- active|inactive
  created_at timestamptz not null default now()
);

create index groups_organization_id_idx on groups (organization_id);
create unique index groups_org_site_name_uq on groups (organization_id, site_id, lower(name));

create table group_members (
  group_id uuid not null references groups(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  role_in_group text not null default 'member', -- leader|assistant|member
  joined_at timestamptz not null default now(),
  primary key (group_id, member_id)
);

alter table groups enable row level security;
alter table group_members enable row level security;

create policy groups_select on groups for select
  to authenticated using (is_org_member(organization_id));
create policy groups_insert on groups for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'groups.write'));
create policy groups_update on groups for update
  to authenticated using (is_org_member(organization_id)) with check (has_permission(organization_id, 'groups.write'));
create policy groups_delete on groups for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'groups.write'));

-- group_members n'a pas organization_id directement : même contournement que
-- department_members (0004), sous-requête via groups.
create policy group_members_select on group_members for select
  to authenticated using (
    exists (select 1 from groups g where g.id = group_members.group_id and is_org_member(g.organization_id))
  );
create policy group_members_write on group_members for all
  to authenticated using (
    exists (
      select 1 from groups g
      where g.id = group_members.group_id
        and is_org_member(g.organization_id)
        and has_permission(g.organization_id, 'groups.write')
    )
  )
  with check (
    exists (
      select 1 from groups g
      where g.id = group_members.group_id
        and has_permission(g.organization_id, 'groups.write')
    )
  );

-- Nouveau module : étend le catalogue RBAC posé en 0001. super_admin/org_admin
-- doivent être réattribués explicitement — leur cross join initial
-- (`cross join permissions p`) était un insert ponctuel figé au moment de la
-- migration 0001, pas une règle vivante qui suit les permissions futures.
insert into permissions (code, description) values
  ('groups.read', 'Consulter les groupes et cellules'),
  ('groups.write', 'Créer/modifier les groupes et cellules');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('groups.read', 'groups.write')
where r.code in ('super_admin', 'org_admin');

-- pastor a déjà departments.read/write (supervision pastorale) — même logique
-- pour les cellules. dept_head est littéralement "Responsable de département
-- / groupe / événement" dans son label_fr (0001) : les groupes sont dans son
-- périmètre par construction.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('groups.read', 'groups.write')
where r.code in ('pastor', 'dept_head');
