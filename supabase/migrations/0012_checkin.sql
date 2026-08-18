-- MAKAV ChurchOS — Check-in enfants
--
-- Enregistre l'arrivée/le départ d'un enfant à un culte ou événement avec un
-- code de sécurité à 4 chiffres partagé entre l'étiquette enfant et le talon
-- parent (voir app/checkin/[id]/etiquette/page.tsx). L'unicité n'a besoin
-- d'être garantie que parmi les sessions actives (pas encore récupérées) —
-- contrairement à la numérotation des reçus de dons, ce n'est pas un document
-- légal séquentiel : un index unique partiel + une nouvelle tentative
-- applicative en cas de collision suffisent (voir createCheckin dans actions.ts).

create table checkin_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  event_id uuid references events(id) on delete set null,
  child_member_id uuid not null references members(id) on delete cascade,
  guardian_name text not null,
  guardian_phone text,
  security_code text not null,
  notes text,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid not null references auth.users(id),
  checked_out_at timestamptz,
  checked_out_by uuid references auth.users(id)
);

create index checkin_sessions_organization_id_idx on checkin_sessions (organization_id);
create index checkin_sessions_child_member_id_idx on checkin_sessions (child_member_id);

-- Un même code ne doit pas désigner deux enfants encore présents en même
-- temps ; une fois l'enfant récupéré (checked_out_at renseigné), le code peut
-- être réutilisé par une session ultérieure.
create unique index checkin_sessions_active_code_uq
  on checkin_sessions (organization_id, security_code)
  where checked_out_at is null;

alter table checkin_sessions enable row level security;

create policy checkin_sessions_select on checkin_sessions for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'checkin.read'));
create policy checkin_sessions_insert on checkin_sessions for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'checkin.write'));
create policy checkin_sessions_update on checkin_sessions for update
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'checkin.read'))
  with check (has_permission(organization_id, 'checkin.write'));
create policy checkin_sessions_delete on checkin_sessions for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'checkin.write'));

insert into permissions (code, description) values
  ('checkin.read', 'Consulter le check-in enfants'),
  ('checkin.write', 'Enregistrer des arrivées/départs au check-in enfants');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('checkin.read', 'checkin.write')
where r.code in ('super_admin', 'org_admin');

-- Activité opérationnelle pilotée au niveau département/groupe, comme
-- groups.*/departments.* : pastor et dept_head y ont accès.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('checkin.read', 'checkin.write')
where r.code in ('pastor', 'dept_head');
