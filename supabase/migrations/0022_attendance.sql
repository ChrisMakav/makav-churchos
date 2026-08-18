-- MAKAV ChurchOS — Statistiques de présence
--
-- Compte-rendu de présence saisi manuellement après un culte (ou tout autre
-- rassemblement) : total par genre/tranche d'âge (femmes/hommes/ados/enfants)
-- + nouvelles personnes. Rattachement à un `events` optionnel (comme
-- `checkin_sessions`, 0012) — beaucoup d'églises ne créent pas d'entrée
-- `events` pour un culte récurrent hebdomadaire, donc `service_date` +
-- `label` libres restent le chemin principal plutôt que d'exiger un
-- événement préexistant.
--
-- `total_count` est une colonne générée (femmes + hommes + ados + enfants)
-- plutôt qu'une saisie libre : évite les écarts de saisie entre le total
-- annoncé et la somme du détail, qui est justement ce que ce module sert à
-- fiabiliser. `new_people_count` reste indépendant (un nouveau est déjà
-- compté dans une des catégories ci-dessus, ce n'est pas une catégorie
-- supplémentaire qui s'additionnerait au total).

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  event_id uuid references events(id) on delete set null,
  service_date date not null,
  label text not null,
  women_count integer not null default 0 check (women_count >= 0),
  men_count integer not null default 0 check (men_count >= 0),
  teens_count integer not null default 0 check (teens_count >= 0),
  children_count integer not null default 0 check (children_count >= 0),
  total_count integer generated always as (women_count + men_count + teens_count + children_count) stored,
  new_people_count integer not null default 0 check (new_people_count >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index attendance_records_organization_id_idx on attendance_records (organization_id);
create index attendance_records_service_date_idx on attendance_records (service_date);

alter table attendance_records enable row level security;

create policy attendance_records_select on attendance_records for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'attendance.read'));
create policy attendance_records_insert on attendance_records for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'attendance.write'));
create policy attendance_records_update on attendance_records for update
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'attendance.read'))
  with check (has_permission(organization_id, 'attendance.write'));
create policy attendance_records_delete on attendance_records for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'attendance.write'));

insert into permissions (code, description) values
  ('attendance.read', 'Consulter les statistiques de présence'),
  ('attendance.write', 'Enregistrer les statistiques de présence');

-- Même périmètre que checkin.* (0012) : activité opérationnelle pilotée au
-- niveau département/campus, pas une donnée sensible comme le suivi pastoral.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('attendance.read', 'attendance.write')
where r.code in ('super_admin', 'org_admin', 'pastor', 'dept_head');
