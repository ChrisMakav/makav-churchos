-- MAKAV ChurchOS — Déroulé de culte + inscriptions ouvertes
--
-- event_service_items : programme minute par minute d'un événement (accueil,
-- louange, prédication...), affiché sur la fiche événement et sur la vue
-- grille hebdomadaire.
-- event_registration_tracks : suivi manuel des inscriptions ouvertes pour un
-- événement (ex. "Portes ouvertes Campus Sud : 180/250"). Pas de formulaire
-- public d'inscription en P1 — le compteur est mis à jour par le staff.

create table event_service_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  starts_at timestamptz not null,
  title text not null,
  owner_name text,
  created_at timestamptz not null default now()
);

create index event_service_items_event_id_idx on event_service_items (event_id);

create table event_registration_tracks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  capacity integer not null,
  registered_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint event_registration_tracks_capacity_positive check (capacity > 0),
  constraint event_registration_tracks_registered_nonneg check (registered_count >= 0)
);

create index event_registration_tracks_event_id_idx on event_registration_tracks (event_id);

alter table event_service_items enable row level security;
alter table event_registration_tracks enable row level security;

-- Pas d'organization_id direct : même contournement que group_members (0010),
-- sous-requête via events.
create policy event_service_items_select on event_service_items for select
  to authenticated using (
    exists (select 1 from events e where e.id = event_service_items.event_id and is_org_member(e.organization_id))
  );
create policy event_service_items_write on event_service_items for all
  to authenticated using (
    exists (
      select 1 from events e
      where e.id = event_service_items.event_id
        and is_org_member(e.organization_id)
        and has_permission(e.organization_id, 'events.write')
    )
  )
  with check (
    exists (
      select 1 from events e
      where e.id = event_service_items.event_id
        and has_permission(e.organization_id, 'events.write')
    )
  );

create policy event_registration_tracks_select on event_registration_tracks for select
  to authenticated using (
    exists (select 1 from events e where e.id = event_registration_tracks.event_id and is_org_member(e.organization_id))
  );
create policy event_registration_tracks_write on event_registration_tracks for all
  to authenticated using (
    exists (
      select 1 from events e
      where e.id = event_registration_tracks.event_id
        and is_org_member(e.organization_id)
        and has_permission(e.organization_id, 'events.write')
    )
  )
  with check (
    exists (
      select 1 from events e
      where e.id = event_registration_tracks.event_id
        and has_permission(e.organization_id, 'events.write')
    )
  );
