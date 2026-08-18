-- MAKAV ChurchOS — Bénévoles & plannings
--
-- Grille de service par équipe (= department, ministère de service —
-- Accueil, Louange... déjà modélisé en 0004) x dimanche. Pas de nouvelle
-- notion d'équipe : on réutilise departments/department_members comme
-- réservoir de bénévoles éligibles par équipe, cohérent avec la note de
-- data-model.md sur departments ("ministère de service").
--
-- Un poste vacant est une ligne à part entière (member_id null, status
-- 'vacant') plutôt qu'une cellule calculée : ça permet à un responsable
-- d'ouvrir explicitement "il nous faut 1 personne ici" avant d'avoir qui que
-- ce soit à affecter, et de laisser une cellule vide (aucune ligne) quand
-- l'équipe n'a simplement rien de prévu ce jour-là — les deux cas sont
-- visuellement différents dans la grille.

create table volunteer_slots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  department_id uuid not null references departments(id) on delete cascade,
  service_date date not null,
  member_id uuid references members(id) on delete set null,
  status text not null default 'vacant', -- vacant|pending|confirmed
  position_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint volunteer_slots_status_check check (status in ('vacant', 'pending', 'confirmed')),
  constraint volunteer_slots_member_status_check check (
    (member_id is null and status = 'vacant') or
    (member_id is not null and status in ('pending', 'confirmed'))
  )
);

create index volunteer_slots_organization_id_idx on volunteer_slots (organization_id);
create index volunteer_slots_department_date_idx on volunteer_slots (department_id, service_date);

alter table volunteer_slots enable row level security;

create policy volunteer_slots_select on volunteer_slots for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'volunteers.read'));
create policy volunteer_slots_insert on volunteer_slots for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'volunteers.write'));
create policy volunteer_slots_update on volunteer_slots for update
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'volunteers.read'))
  with check (has_permission(organization_id, 'volunteers.write'));
create policy volunteer_slots_delete on volunteer_slots for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'volunteers.write'));

-- Nouveau module : étend le catalogue RBAC posé en 0001 (voir 0010/0012 pour
-- le même pattern). super_admin/org_admin réattribués explicitement — leur
-- cross join initial était un insert ponctuel figé à la migration 0001.
insert into permissions (code, description) values
  ('volunteers.read', 'Consulter les plannings de bénévoles'),
  ('volunteers.write', 'Affecter/retirer des bénévoles sur les plannings');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('volunteers.read', 'volunteers.write')
where r.code in ('super_admin', 'org_admin');

-- volunteer_manager ("Responsable RH / bénévoles") est seedé depuis 0001 sans
-- jamais avoir eu de permission câblée — c'est exactement son périmètre.
-- pastor a déjà departments.read/write (supervision) ; dept_head est
-- responsable de département par construction (label_fr 0001) : les deux
-- héritent aussi de la même logique que groups.*/checkin.* (0010/0012).
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('volunteers.read', 'volunteers.write')
where r.code in ('volunteer_manager', 'pastor', 'dept_head');
