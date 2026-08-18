-- MAKAV ChurchOS — Salles (ressources réservables pour les événements)
--
-- Jusqu'ici events.location était un texte libre. On introduit une table
-- rooms pour permettre une vraie détection de conflit de réservation (deux
-- événements sur la même salle avec des horaires qui se chevauchent).
-- location reste disponible sur events pour un lieu hors-salle (ex. "Parc
-- municipal") ou une précision complémentaire.

create table rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  name text not null,
  capacity integer,
  created_at timestamptz not null default now()
);

create index rooms_organization_id_idx on rooms (organization_id);
create unique index rooms_org_site_name_uq on rooms (organization_id, site_id, lower(name));

alter table rooms enable row level security;

create policy rooms_select on rooms for select
  to authenticated using (is_org_member(organization_id));
create policy rooms_insert on rooms for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'events.write'));
create policy rooms_update on rooms for update
  to authenticated using (is_org_member(organization_id)) with check (has_permission(organization_id, 'events.write'));
create policy rooms_delete on rooms for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'events.write'));

alter table events add column room_id uuid references rooms(id) on delete set null;
create index events_room_id_idx on events (room_id);
