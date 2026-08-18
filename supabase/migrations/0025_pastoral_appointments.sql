-- MAKAV ChurchOS — Rendez-vous pastoraux
--
-- Un pasteur publie des créneaux ("agenda disponible"), un membre en réserve
-- un depuis le portail (`(member)/mon-espace`). Une seule table fait office
-- de créneau ET de rendez-vous une fois réservé — même pattern que
-- `volunteer_slots` (0018) : `member_id is null ⟺ status = 'open'`, pas de
-- table séparée "créneau" / "rendez-vous".
--
-- Statuts : open (publié, réservable) → requested (réservé, en attente de
-- confirmation) → confirmed (confirmé par le pasteur) → completed (rendez-vous
-- passé). Annuler (par le pasteur ou par le membre) fait TOUJOURS revenir le
-- créneau à `open` (member_id/reason effacés) plutôt qu'un statut `cancelled`
-- distinct — encore une fois comme `volunteer_slots`, qui ne garde pas
-- d'historique des désistements. Le pasteur peut ainsi réutiliser le créneau
-- sans avoir à en recréer un.
--
-- Confidentialité (demande explicite) : contrairement à `pastoral_records`
-- (0011) où pastoral_care.read/write est accordé au rôle `pastor` tout entier
-- (donc tous les pasteurs se voient mutuellement), ici chaque pasteur ne voit
-- que SES PROPRES créneaux (`pastor_user_id = auth.uid()`) — un rendez-vous
-- pris avec le pasteur A reste invisible au pasteur B. org_admin/super_admin
-- gardent une vue d'ensemble (`organization.manage`, jamais accordé au rôle
-- `pastor` lui-même, voir 0001) pour la supervision/le paramétrage. Côté
-- membre, un membre ne voit que les créneaux encore `open` (pour en choisir
-- un) et SES PROPRES rendez-vous, jamais ceux d'un autre membre — même
-- pattern self-service que `donations_select_self`/`group_members_select_self`
-- (0020).
--
-- Pas de champ "notes privées du pasteur" sur cette table : ce besoin existe
-- déjà et en mieux via `pastoral_records` (déjà 100% confidentiel côté
-- pasteur, déjà lié à `member_id`) — le pasteur y logue une entrée après le
-- rendez-vous plutôt que de dupliquer un champ notes ici avec une visibilité
-- à gérer séparément du reste de la ligne (`reason`, lui, est saisi par le
-- membre et doit rester visible aux deux parties).

create table pastoral_appointment_slots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  pastor_user_id uuid not null references auth.users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  member_id uuid references members(id) on delete set null,
  reason text,
  status text not null default 'open', -- open|requested|confirmed|completed
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint pastoral_appointment_slots_ends_after_starts check (ends_at > starts_at),
  constraint pastoral_appointment_slots_member_status check (
    (status = 'open' and member_id is null) or (status <> 'open' and member_id is not null)
  )
);

create index pastoral_appointment_slots_organization_id_idx on pastoral_appointment_slots (organization_id);
create index pastoral_appointment_slots_pastor_user_id_idx on pastoral_appointment_slots (pastor_user_id);
create index pastoral_appointment_slots_member_id_idx on pastoral_appointment_slots (member_id);

alter table pastoral_appointment_slots enable row level security;

-- Staff : le pasteur assigné gère ses propres créneaux ; org_admin/super_admin
-- (organization.manage) ont une vue d'ensemble. Un pasteur B n'a accès à rien
-- ici pour les créneaux du pasteur A — voir commentaire d'en-tête.
create policy pastoral_appointment_slots_select_staff on pastoral_appointment_slots for select
  to authenticated using (
    is_org_member(organization_id)
    and has_permission(organization_id, 'pastoral_appointments.read')
    and (pastor_user_id = auth.uid() or has_permission(organization_id, 'organization.manage'))
  );
create policy pastoral_appointment_slots_insert_staff on pastoral_appointment_slots for insert
  to authenticated with check (
    is_org_member(organization_id)
    and has_permission(organization_id, 'pastoral_appointments.write')
    and (pastor_user_id = auth.uid() or has_permission(organization_id, 'organization.manage'))
  );
create policy pastoral_appointment_slots_update_staff on pastoral_appointment_slots for update
  to authenticated using (
    is_org_member(organization_id)
    and has_permission(organization_id, 'pastoral_appointments.read')
    and (pastor_user_id = auth.uid() or has_permission(organization_id, 'organization.manage'))
  )
  with check (has_permission(organization_id, 'pastoral_appointments.write'));
create policy pastoral_appointment_slots_delete_staff on pastoral_appointment_slots for delete
  to authenticated using (
    is_org_member(organization_id)
    and has_permission(organization_id, 'pastoral_appointments.write')
    and (pastor_user_id = auth.uid() or has_permission(organization_id, 'organization.manage'))
  );

-- Membre (portail self-service) : créneaux encore ouverts (pour en choisir
-- un) + ses propres rendez-vous quel qu'en soit le statut, jamais ceux d'un
-- autre membre.
create policy pastoral_appointment_slots_select_open on pastoral_appointment_slots for select
  to authenticated using (
    status = 'open'
    and exists (
      select 1 from members m
      where m.organization_id = pastoral_appointment_slots.organization_id and m.user_id = auth.uid()
    )
  );
create policy pastoral_appointment_slots_select_self on pastoral_appointment_slots for select
  to authenticated using (
    exists (select 1 from members m where m.id = pastoral_appointment_slots.member_id and m.user_id = auth.uid())
  );

-- Réserver un créneau ouvert.
create policy pastoral_appointment_slots_book_self on pastoral_appointment_slots for update
  to authenticated using (
    status = 'open'
    and exists (
      select 1 from members m
      where m.organization_id = pastoral_appointment_slots.organization_id and m.user_id = auth.uid()
    )
  )
  with check (
    status = 'requested'
    and exists (select 1 from members m where m.id = pastoral_appointment_slots.member_id and m.user_id = auth.uid())
  );

-- Annuler son propre rendez-vous (requested ou confirmed) : rouvre le créneau.
create policy pastoral_appointment_slots_cancel_self on pastoral_appointment_slots for update
  to authenticated using (
    status in ('requested', 'confirmed')
    and exists (select 1 from members m where m.id = pastoral_appointment_slots.member_id and m.user_id = auth.uid())
  )
  with check (status = 'open' and member_id is null);

insert into permissions (code, description) values
  ('pastoral_appointments.read', 'Consulter les rendez-vous pastoraux'),
  ('pastoral_appointments.write', 'Gérer les créneaux et rendez-vous pastoraux');

-- Même périmètre que pastoral_care.* (0011) : ni dept_head ni finance_manager.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('pastoral_appointments.read', 'pastoral_appointments.write')
where r.code in ('super_admin', 'org_admin', 'pastor');
