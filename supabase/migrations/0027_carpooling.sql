-- Module Covoiturage — décisions de conception (voir docs/architecture/data-model.md) :
--
-- * Une seule table `carpool_ride_requests` (pas de split RideRequests /
--   Reservations) — même simplification que `volunteer_slots` et
--   `pastoral_appointment_slots` : une ligne, un statut qui évolue.
-- * Conducteur = un membre (`driver_member_id references members(id)`), pas
--   d'entité « Driver » séparée.
-- * Champs de lieu nommés `*_label` (pas `*_address`) — laisse la place à un
--   futur `*_lat`/`*_lng` sans renommage (voir roadmap V2 géocodage).
-- * Trajets récurrents = N lignes pré-générées côté application partageant un
--   `recurrence_group_id`, pas de moteur RRULE live en base.
-- * Gestion des places via RPC SECURITY DEFINER avec verrouillage de ligne
--   (`for update`) — jamais d'UPDATE client direct sur `seats_available`.
--   `seat_capacity` est immuable après création en MVP.
-- * Check-in passager = 2 colonnes sur `carpool_ride_requests`
--   (`checked_in_at`, `no_show`), pas de table dédiée comme
--   `checkin_sessions` : chaque passager a déjà une ligne naturelle ici.
-- * `carpool_vehicles` n'a pas de `site_id` (rattaché au membre, pas à un
--   site) — déviation volontaire par rapport à la convention générale.
-- * La plaque n'est jamais stockée en clair (`plate_masked`, masquage fait
--   côté Server Action avant insert).
-- * Module à double coquille : `(dashboard)/covoiturage` (supervision staff,
--   permissions `carpooling.read`/`carpooling.manage`) et
--   `(member)/mon-espace/covoiturage` (self-service membre, RLS additive sur
--   `members.user_id = auth.uid()`, sans permission dédiée côté membre — même
--   modèle que `pastoral_appointment_slots`, 0025/0026).

-- ---------------------------------------------------------------------------
-- 1. Véhicules
-- ---------------------------------------------------------------------------
create table carpool_vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  brand text not null,
  model text not null,
  color text,
  plate_masked text,
  seat_capacity integer not null,
  is_pmr_accessible boolean not null default false,
  created_at timestamptz not null default now(),
  constraint carpool_vehicles_seat_capacity_positive check (seat_capacity > 0)
);
create index carpool_vehicles_organization_id_idx on carpool_vehicles (organization_id);
create index carpool_vehicles_member_id_idx on carpool_vehicles (member_id);

-- ---------------------------------------------------------------------------
-- 2. Trajets
-- ---------------------------------------------------------------------------
create table carpool_rides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  event_id uuid references events(id) on delete set null,
  driver_member_id uuid not null references members(id) on delete cascade,
  vehicle_id uuid references carpool_vehicles(id) on delete set null,
  departure_label text not null,
  destination_label text not null,
  departs_at timestamptz not null,
  estimated_arrival_at timestamptz,
  seat_capacity integer not null,
  seats_available integer not null,
  auto_confirm boolean not null default false,
  accepts_children boolean not null default true,
  accepts_luggage boolean not null default true,
  accepts_pets boolean not null default false,
  non_smoking boolean not null default true,
  has_air_conditioning boolean not null default false,
  is_pmr_accessible boolean not null default false,
  status text not null default 'scheduled',
  notes text,
  recurrence_group_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint carpool_rides_status_check check (status in ('scheduled','in_progress','completed','cancelled')),
  constraint carpool_rides_seat_capacity_positive check (seat_capacity > 0),
  constraint carpool_rides_seats_available_range check (seats_available >= 0 and seats_available <= seat_capacity),
  constraint carpool_rides_arrival_after_departure check (estimated_arrival_at is null or estimated_arrival_at > departs_at)
);
create index carpool_rides_organization_id_idx on carpool_rides (organization_id);
create index carpool_rides_event_id_idx on carpool_rides (event_id);
create index carpool_rides_driver_member_id_idx on carpool_rides (driver_member_id);
create index carpool_rides_departs_at_idx on carpool_rides (departs_at);
create index carpool_rides_recurrence_group_id_idx on carpool_rides (recurrence_group_id) where recurrence_group_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Points d'arrêt (ordonnés, par trajet) — même pattern que
--    event_service_items (0014) : pas d'organization_id direct, RLS via le
--    trajet parent.
-- ---------------------------------------------------------------------------
create table carpool_ride_stops (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references carpool_rides(id) on delete cascade,
  position_order integer not null default 0,
  label text not null,
  address text,
  estimated_time timestamptz,
  created_at timestamptz not null default now()
);
create index carpool_ride_stops_ride_id_idx on carpool_ride_stops (ride_id);

-- ---------------------------------------------------------------------------
-- 4. Demandes / réservations de place — une seule table (voir note en tête
--    de fichier). checked_in_at/no_show portent le check-in passager
--    directement sur la ligne.
-- ---------------------------------------------------------------------------
create table carpool_ride_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ride_id uuid not null references carpool_rides(id) on delete cascade,
  passenger_member_id uuid not null references members(id) on delete cascade,
  seats_requested integer not null default 1,
  status text not null default 'pending',
  message text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  checked_in_at timestamptz,
  no_show boolean not null default false,
  created_at timestamptz not null default now(),
  constraint carpool_ride_requests_status_check check (status in ('pending','confirmed','declined','cancelled','waitlisted')),
  constraint carpool_ride_requests_seats_positive check (seats_requested > 0)
);
create index carpool_ride_requests_ride_id_idx on carpool_ride_requests (ride_id);
create index carpool_ride_requests_passenger_member_id_idx on carpool_ride_requests (passenger_member_id);

-- Une seule demande ACTIVE par passager par trajet (pending/confirmed/
-- waitlisted) — après refus/annulation (statut terminal), une nouvelle ligne
-- peut être créée pour un nouvel essai.
create unique index carpool_ride_requests_active_uq
  on carpool_ride_requests (ride_id, passenger_member_id)
  where status in ('pending', 'confirmed', 'waitlisted');

-- ---------------------------------------------------------------------------
-- 5. "J'ai besoin d'un trajet" — tableau de besoins, pas de moteur de
--    matching (voir roadmap V2 dans data-model.md).
-- ---------------------------------------------------------------------------
create table carpool_ride_needs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  member_id uuid not null references members(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  departure_label text not null,
  needed_by timestamptz,
  seats_needed integer not null default 1,
  has_children boolean not null default false,
  notes text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint carpool_ride_needs_status_check check (status in ('open','matched','cancelled')),
  constraint carpool_ride_needs_seats_positive check (seats_needed > 0)
);
create index carpool_ride_needs_organization_id_idx on carpool_ride_needs (organization_id);

-- ---------------------------------------------------------------------------
-- 6. "Je souhaite être chauffeur bénévole" — déclaration de disponibilité,
--    ne crée aucun trajet elle-même. Une ligne par membre (upsert).
-- ---------------------------------------------------------------------------
create table carpool_driver_availabilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  vehicle_id uuid references carpool_vehicles(id) on delete set null,
  zones text,
  frequency text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, member_id)
);

-- ---------------------------------------------------------------------------
-- 7. Incidents
-- ---------------------------------------------------------------------------
create table carpool_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ride_id uuid not null references carpool_rides(id) on delete cascade,
  reported_by_member_id uuid not null references members(id) on delete cascade,
  incident_type text not null,
  description text not null,
  status text not null default 'open',
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint carpool_incidents_status_check check (status in ('open','resolved'))
);
create index carpool_incidents_organization_id_idx on carpool_incidents (organization_id);
create index carpool_incidents_ride_id_idx on carpool_incidents (ride_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table carpool_vehicles enable row level security;
alter table carpool_rides enable row level security;
alter table carpool_ride_stops enable row level security;
alter table carpool_ride_requests enable row level security;
alter table carpool_ride_needs enable row level security;
alter table carpool_driver_availabilities enable row level security;
alter table carpool_incidents enable row level security;

-- Véhicules : staff (supervision) + le membre propriétaire (self-service).
create policy carpool_vehicles_select_staff on carpool_vehicles for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'carpooling.read'));
create policy carpool_vehicles_select_self on carpool_vehicles for select
  to authenticated using (exists (select 1 from members m where m.id = carpool_vehicles.member_id and m.user_id = auth.uid()));
create policy carpool_vehicles_write_self on carpool_vehicles for all
  to authenticated
  using (exists (select 1 from members m where m.id = carpool_vehicles.member_id and m.user_id = auth.uid()))
  with check (exists (select 1 from members m where m.id = carpool_vehicles.member_id and m.user_id = auth.uid()));

-- Trajets : lecture large (staff supervision OU tout membre de
-- l'organisation, nécessaire pour la recherche self-service, même pattern
-- que events_select_member/0020). Écriture : le conducteur gère SON trajet ;
-- le staff carpooling.manage garde une vue de supervision (annulation
-- d'office, etc.).
create policy carpool_rides_select_staff on carpool_rides for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'carpooling.read'));
create policy carpool_rides_select_member on carpool_rides for select
  to authenticated using (exists (select 1 from members m where m.organization_id = carpool_rides.organization_id and m.user_id = auth.uid()));
create policy carpool_rides_insert_self on carpool_rides for insert
  to authenticated with check (
    exists (select 1 from members m where m.id = carpool_rides.driver_member_id and m.user_id = auth.uid() and m.organization_id = carpool_rides.organization_id)
  );
create policy carpool_rides_update_driver on carpool_rides for update
  to authenticated
  using (exists (select 1 from members m where m.id = carpool_rides.driver_member_id and m.user_id = auth.uid()))
  with check (exists (select 1 from members m where m.id = carpool_rides.driver_member_id and m.user_id = auth.uid()));
create policy carpool_rides_manage_staff on carpool_rides for update
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'carpooling.manage'))
  with check (has_permission(organization_id, 'carpooling.manage'));

-- Points d'arrêt : RLS via le trajet parent.
create policy carpool_ride_stops_select on carpool_ride_stops for select
  to authenticated using (
    exists (select 1 from carpool_rides r where r.id = carpool_ride_stops.ride_id and (
      exists (select 1 from members m where m.organization_id = r.organization_id and m.user_id = auth.uid())
      or has_permission(r.organization_id, 'carpooling.read')
    ))
  );
create policy carpool_ride_stops_write_driver on carpool_ride_stops for all
  to authenticated
  using (exists (select 1 from carpool_rides r join members m on m.id = r.driver_member_id where r.id = carpool_ride_stops.ride_id and m.user_id = auth.uid()))
  with check (exists (select 1 from carpool_rides r join members m on m.id = r.driver_member_id where r.id = carpool_ride_stops.ride_id and m.user_id = auth.uid()));

-- Demandes de place : le conducteur, le passager, et le staff
-- carpooling.manage peuvent LIRE. Aucune policy insert/update client — tout
-- passe par les RPC ci-dessous (même raisonnement que create_donation :
-- logique métier + verrouillage concurrentiel côté SECURITY DEFINER).
create policy carpool_ride_requests_select_driver on carpool_ride_requests for select
  to authenticated using (exists (select 1 from carpool_rides r join members m on m.id = r.driver_member_id where r.id = carpool_ride_requests.ride_id and m.user_id = auth.uid()));
create policy carpool_ride_requests_select_passenger on carpool_ride_requests for select
  to authenticated using (exists (select 1 from members m where m.id = carpool_ride_requests.passenger_member_id and m.user_id = auth.uid()));
create policy carpool_ride_requests_select_staff on carpool_ride_requests for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'carpooling.manage'));

-- Besoins de trajet : lecture large (staff + tout membre, pour que
-- conducteurs/staff les parcourent) ; écriture réservée à l'auteur.
create policy carpool_ride_needs_select_staff on carpool_ride_needs for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'carpooling.read'));
create policy carpool_ride_needs_select_member on carpool_ride_needs for select
  to authenticated using (exists (select 1 from members m where m.organization_id = carpool_ride_needs.organization_id and m.user_id = auth.uid()));
create policy carpool_ride_needs_write_self on carpool_ride_needs for all
  to authenticated
  using (exists (select 1 from members m where m.id = carpool_ride_needs.member_id and m.user_id = auth.uid()))
  with check (exists (select 1 from members m where m.id = carpool_ride_needs.member_id and m.user_id = auth.uid()));

-- Disponibilités chauffeur : staff (carpooling.manage) parcourt tout ;
-- membre gère la sienne.
create policy carpool_driver_availabilities_select_staff on carpool_driver_availabilities for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'carpooling.manage'));
create policy carpool_driver_availabilities_write_self on carpool_driver_availabilities for all
  to authenticated
  using (exists (select 1 from members m where m.id = carpool_driver_availabilities.member_id and m.user_id = auth.uid()))
  with check (exists (select 1 from members m where m.id = carpool_driver_availabilities.member_id and m.user_id = auth.uid()));

-- Incidents : signalé par tout membre de l'organisation, visible par
-- l'auteur + staff carpooling.manage ; résolution réservée au staff.
create policy carpool_incidents_select_reporter on carpool_incidents for select
  to authenticated using (exists (select 1 from members m where m.id = carpool_incidents.reported_by_member_id and m.user_id = auth.uid()));
create policy carpool_incidents_select_staff on carpool_incidents for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'carpooling.manage'));
create policy carpool_incidents_insert_self on carpool_incidents for insert
  to authenticated with check (
    exists (select 1 from members m where m.id = carpool_incidents.reported_by_member_id and m.user_id = auth.uid() and m.organization_id = carpool_incidents.organization_id)
  );
create policy carpool_incidents_resolve_staff on carpool_incidents for update
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'carpooling.manage'))
  with check (has_permission(organization_id, 'carpooling.manage'));

-- ---------------------------------------------------------------------------
-- Gestion atomique des places — 4 RPC SECURITY DEFINER (précédent :
-- create_donation, 0007). seats_available n'est jamais écrit par le client,
-- uniquement par ces fonctions, avec `select ... for update` sur
-- carpool_rides pour sérialiser les demandes concurrentes sur un même
-- trajet.
-- ---------------------------------------------------------------------------

create function request_carpool_seat(target_ride_id uuid, seats integer, request_message text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  requesting_member_id uuid;
  ride carpool_rides%rowtype;
  new_status text;
  new_request_id uuid;
begin
  select r.* into ride from carpool_rides r where r.id = target_ride_id for update;
  if not found then
    raise exception 'Trajet introuvable';
  end if;

  select id into requesting_member_id from members
  where user_id = auth.uid() and organization_id = ride.organization_id
  limit 1;
  if requesting_member_id is null then
    raise exception 'Aucune fiche membre associée à cet utilisateur';
  end if;
  if requesting_member_id = ride.driver_member_id then
    raise exception 'Le conducteur ne peut pas réserver son propre trajet';
  end if;
  if ride.status <> 'scheduled' then
    raise exception 'Ce trajet n''accepte plus de demandes';
  end if;
  if seats < 1 then
    raise exception 'Nombre de places invalide';
  end if;

  if ride.auto_confirm and ride.seats_available >= seats then
    new_status := 'confirmed';
  elsif ride.auto_confirm then
    new_status := 'waitlisted';
  else
    new_status := 'pending';
  end if;

  insert into carpool_ride_requests (
    organization_id, ride_id, passenger_member_id, seats_requested, status, message, decided_at
  ) values (
    ride.organization_id, target_ride_id, requesting_member_id, seats, new_status, request_message,
    case when new_status = 'confirmed' then now() else null end
  ) returning id into new_request_id;

  if new_status = 'confirmed' then
    update carpool_rides set seats_available = seats_available - seats where id = target_ride_id;
  end if;

  insert into notifications (organization_id, user_id, type, title, body, link)
  select ride.organization_id, m.user_id, 'carpool_request_received',
    'Nouvelle demande de covoiturage',
    'Une demande de ' || seats || ' place(s) a été reçue pour votre trajet du ' || to_char(ride.departs_at, 'DD/MM à HH24:MI') || '.',
    '/mon-espace/covoiturage/mes-trajets/' || target_ride_id
  from members m where m.id = ride.driver_member_id and m.user_id is not null;

  return new_request_id;
end;
$$;

create function respond_carpool_request(target_request_id uuid, approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req carpool_ride_requests%rowtype;
  ride carpool_rides%rowtype;
  passenger_user_id uuid;
begin
  select * into req from carpool_ride_requests where id = target_request_id;
  if not found or req.status <> 'pending' then
    raise exception 'Demande introuvable ou déjà traitée';
  end if;

  select * into ride from carpool_rides where id = req.ride_id for update;

  if not (
    exists (select 1 from members m where m.id = ride.driver_member_id and m.user_id = auth.uid())
    or has_permission(ride.organization_id, 'carpooling.manage')
  ) then
    raise exception 'Permission refusée';
  end if;

  if approve then
    if ride.seats_available < req.seats_requested then
      raise exception 'Plus assez de places disponibles';
    end if;
    update carpool_ride_requests set status = 'confirmed', decided_at = now() where id = target_request_id;
    update carpool_rides set seats_available = seats_available - req.seats_requested where id = ride.id;
  else
    update carpool_ride_requests set status = 'declined', decided_at = now() where id = target_request_id;
  end if;

  select user_id into passenger_user_id from members where id = req.passenger_member_id;
  if passenger_user_id is not null then
    insert into notifications (organization_id, user_id, type, title, body, link)
    values (
      ride.organization_id, passenger_user_id,
      case when approve then 'carpool_request_confirmed' else 'carpool_request_declined' end,
      case when approve then 'Place confirmée' else 'Demande refusée' end,
      'Votre demande pour le trajet du ' || to_char(ride.departs_at, 'DD/MM à HH24:MI') || ' a été ' || (case when approve then 'confirmée' else 'refusée' end) || '.',
      '/mon-espace/covoiturage/mes-reservations'
    );
  end if;
end;
$$;

create function cancel_carpool_request(target_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req carpool_ride_requests%rowtype;
  ride carpool_rides%rowtype;
  waiting carpool_ride_requests%rowtype;
  passenger_user_id uuid;
begin
  select * into req from carpool_ride_requests where id = target_request_id;
  if not found or req.status not in ('pending', 'confirmed', 'waitlisted') then
    raise exception 'Demande introuvable ou déjà annulée';
  end if;

  select * into ride from carpool_rides where id = req.ride_id for update;

  if not (
    exists (select 1 from members m where m.id = req.passenger_member_id and m.user_id = auth.uid())
    or exists (select 1 from members m where m.id = ride.driver_member_id and m.user_id = auth.uid())
    or has_permission(ride.organization_id, 'carpooling.manage')
  ) then
    raise exception 'Permission refusée';
  end if;

  update carpool_ride_requests set status = 'cancelled', decided_at = now() where id = target_request_id;

  if req.status = 'confirmed' then
    update carpool_rides set seats_available = seats_available + req.seats_requested where id = ride.id;

    -- Promotion synchrone des demandes waitlisted (plus ancienne d'abord)
    -- tant que la place restante permet de couvrir seats_requested.
    for waiting in
      select * from carpool_ride_requests
      where ride_id = ride.id and status = 'waitlisted'
      order by requested_at asc
    loop
      if (select seats_available from carpool_rides where id = ride.id) >= waiting.seats_requested then
        update carpool_ride_requests set status = 'confirmed', decided_at = now() where id = waiting.id;
        update carpool_rides set seats_available = seats_available - waiting.seats_requested where id = ride.id;

        select user_id into passenger_user_id from members where id = waiting.passenger_member_id;
        if passenger_user_id is not null then
          insert into notifications (organization_id, user_id, type, title, body, link)
          values (ride.organization_id, passenger_user_id, 'carpool_waitlist_promoted',
            'Une place s''est libérée',
            'Votre demande en liste d''attente pour le trajet du ' || to_char(ride.departs_at, 'DD/MM à HH24:MI') || ' est maintenant confirmée.',
            '/mon-espace/covoiturage/mes-reservations');
        end if;
      end if;
    end loop;
  end if;
end;
$$;

create function mark_carpool_request_checkin(target_request_id uuid, boarded boolean, is_no_show boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req carpool_ride_requests%rowtype;
  ride carpool_rides%rowtype;
begin
  select * into req from carpool_ride_requests where id = target_request_id;
  select * into ride from carpool_rides where id = req.ride_id;

  if not (
    exists (select 1 from members m where m.id = ride.driver_member_id and m.user_id = auth.uid())
    or has_permission(ride.organization_id, 'carpooling.manage')
  ) then
    raise exception 'Permission refusée';
  end if;

  update carpool_ride_requests
  set checked_in_at = case when boarded then now() else null end,
      no_show = is_no_show
  where id = target_request_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into permissions (code, description) values
  ('carpooling.read', 'Consulter les trajets de covoiturage'),
  ('carpooling.participate', 'Proposer un trajet et demander une place (en tant que membre)'),
  ('carpooling.manage', 'Superviser tous les trajets, incidents et statistiques covoiturage');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('carpooling.read', 'carpooling.participate', 'carpooling.manage')
where r.code in ('super_admin', 'org_admin');

-- Supervision : mêmes rôles que volunteers.*/checkin.* — activité
-- opérationnelle pilotée au niveau département/campus.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('carpooling.read', 'carpooling.manage')
where r.code in ('volunteer_manager', 'dept_head', 'pastor');

-- member/visitor : câblées pour complétude du catalogue RBAC, mais NE SONT
-- PAS le mécanisme réel d'accès self-service portail — celui-ci passe
-- entièrement par les policies RLS additives ci-dessus
-- (members.user_id = auth.uid()), sans vérification de permission, exactement
-- comme 0020_member_portal.sql/0025. Un membre portail n'a typiquement aucune
-- ligne `memberships` et ne "possède" donc pas ces permissions au sens RBAC.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('carpooling.read', 'carpooling.participate')
where r.code in ('member', 'visitor');
