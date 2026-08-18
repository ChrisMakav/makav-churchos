-- MAKAV ChurchOS — Rapports d'activité de cellule
--
-- Compte-rendu saisi par le responsable après une rencontre de groupe/cellule
-- (0010_groups.sql) : présence, thème abordé, nouvelles personnes, nouvelles
-- naissances. Table enfant de `groups`, même esprit que `group_members` —
-- pas de organization_id vérifié directement en RLS pour les policies
-- d'écriture, sous-requête via `groups` comme pour `group_members` (0010).
--
-- Aucun nouveau code de permission : ce module vit entièrement dans le
-- périmètre `groups.write` existant (0010), comme `addGroupMember`/
-- `removeGroupMember`/`setGroupLeader` dans `groupes/actions.ts`. La policy
-- de lecture suit celle de `groups` elle-même (is_org_member seul, pas de
-- vérification `groups.read` — ce code de permission existe au catalogue
-- mais n'est appliqué nulle part, voir groups_select dans 0010).

create table group_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  group_id uuid not null references groups(id) on delete cascade,
  meeting_date date not null,
  attendance_count integer not null default 0 check (attendance_count >= 0),
  theme text not null,
  new_people_count integer not null default 0 check (new_people_count >= 0),
  new_births_count integer not null default 0 check (new_births_count >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index group_reports_organization_id_idx on group_reports (organization_id);
create index group_reports_group_id_idx on group_reports (group_id);

alter table group_reports enable row level security;

create policy group_reports_select on group_reports for select
  to authenticated using (is_org_member(organization_id));
create policy group_reports_insert on group_reports for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'groups.write'));
create policy group_reports_update on group_reports for update
  to authenticated using (is_org_member(organization_id))
  with check (has_permission(organization_id, 'groups.write'));
create policy group_reports_delete on group_reports for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'groups.write'));
