-- MAKAV ChurchOS — Suivi pastoral
--
-- Journal de visites/appels/besoins de prière par membre, à destination des
-- pasteurs. Données sensibles par nature (voir le risque #5 du plan initial :
-- "les données sensibles ne doivent pas être de simples colonnes avec la même
-- policy large que nom/téléphone") — permissions dédiées et volontairement
-- plus restrictives que members.read/write : ni dept_head ni finance_manager
-- n'y ont accès, contrairement aux départements/groupes.

create table pastoral_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  member_id uuid not null references members(id) on delete cascade,
  category text not null default 'visit', -- visit|call|hospital|counseling|prayer_request|other
  notes text not null,
  status text not null default 'open', -- open|in_progress|closed
  follow_up_date date,
  assigned_to uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index pastoral_records_organization_id_idx on pastoral_records (organization_id);
create index pastoral_records_member_id_idx on pastoral_records (member_id);

alter table pastoral_records enable row level security;

create policy pastoral_records_select on pastoral_records for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'pastoral_care.read'));
create policy pastoral_records_insert on pastoral_records for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'pastoral_care.write'));
create policy pastoral_records_update on pastoral_records for update
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'pastoral_care.read'))
  with check (has_permission(organization_id, 'pastoral_care.write'));
create policy pastoral_records_delete on pastoral_records for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'pastoral_care.write'));

insert into permissions (code, description) values
  ('pastoral_care.read', 'Consulter le suivi pastoral'),
  ('pastoral_care.write', 'Créer/modifier le suivi pastoral');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('pastoral_care.read', 'pastoral_care.write')
where r.code in ('super_admin', 'org_admin');

-- Volontairement réservé aux pasteurs : ni dept_head ni finance_manager
-- (contrairement à groups.*/departments.*) — voir le commentaire d'en-tête.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('pastoral_care.read', 'pastoral_care.write')
where r.code = 'pastor';
