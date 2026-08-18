-- MAKAV ChurchOS — App membre (portail self-service)
--
-- Portail séparé du shell staff (dashboard) : un membre (ligne `members`,
-- distincte des `memberships` staff) peut se créer un compte Supabase Auth et
-- consulter ses propres données. Le même compte auth.users peut être à la
-- fois staff (via memberships) et membre (via members.user_id) — aucune
-- exclusivité, cohérent avec le reste du modèle multi-rôle.
--
-- Aucune nouvelle table : uniquement des policies RLS additives (permissives,
-- elles s'additionnent en OR aux policies `is_org_member` existantes, voir
-- overview.md) qui ouvrent l'accès "à mes propres données" en plus de l'accès
-- "je suis staff de cette organisation". Portée volontairement restreinte
-- pour ce premier incrément — voir data-model.md pour le détail des choix
-- (pas de liste des autres membres du groupe, pas d'inscription aux
-- événements, pas de vue famille).

-- ---------------------------------------------------------------------------
-- 1. members — un membre peut lire/modifier sa propre fiche
-- ---------------------------------------------------------------------------
create policy members_select_self on members for select
  to authenticated using (user_id = auth.uid());
create policy members_update_self on members for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. donations — un membre peut lire ses propres dons (historique + reçus)
-- ---------------------------------------------------------------------------
create policy donations_select_self on donations for select
  to authenticated using (
    exists (select 1 from members m where m.id = donations.member_id and m.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3. events — un membre peut lire les événements de son organisation
-- (lecture seule : pas d'inscription en ligne en P1, voir 0014 —
-- event_registration_tracks reste un compteur géré par le staff)
-- ---------------------------------------------------------------------------
create policy events_select_member on events for select
  to authenticated using (
    exists (select 1 from members m where m.organization_id = events.organization_id and m.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 4. groups / group_members — un membre peut voir SES propres groupes.
-- group_members_select_self ne renvoie que la/les ligne(s) du membre
-- lui-même (pas le reste du roster : éviter d'exposer les autres membres
-- d'un groupe à un pair sans décision produit explicite sur ce partage de
-- PII). groups_select_member complète pour lire les champs du groupe une
-- fois le group_id connu côté application.
-- ---------------------------------------------------------------------------
create policy group_members_select_self on group_members for select
  to authenticated using (
    exists (select 1 from members m where m.id = group_members.member_id and m.user_id = auth.uid())
  );
create policy groups_select_member on groups for select
  to authenticated using (
    exists (
      select 1 from group_members gm
      join members m on m.id = gm.member_id
      where gm.group_id = groups.id and m.user_id = auth.uid()
    )
  );

-- notifications : déjà `user_id = auth.uid()` depuis 0008 (bell staff) — sert
-- tel quel de canal du portail membre, aucune policy supplémentaire requise.

-- ---------------------------------------------------------------------------
-- 5. Réclamation automatique d'une fiche membre à l'inscription — même
-- pattern que la réclamation de memberships staff par email (0001/0002),
-- appliqué en plus (pas à la place) dans handle_new_user().
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );

  update memberships
  set user_id = new.id, status = 'active', invited_email = null
  where invited_email = lower(new.email) and user_id is null;

  -- Rattache toute fiche membre existante (créée par le staff via le module
  -- Membres) partageant cet email et pas encore liée à un compte. Pas de
  -- filtre par organisation : un même email peut correspondre à une fiche
  -- membre dans plusieurs organisations (rare mais possible), les deux sont
  -- réclamées.
  update members
  set user_id = new.id
  where lower(email) = lower(new.email) and user_id is null;

  return new;
end;
$$;
