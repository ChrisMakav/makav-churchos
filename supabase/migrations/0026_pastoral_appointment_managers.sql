-- MAKAV ChurchOS — Responsables des rendez-vous pastoraux
--
-- 0025 ne permettait de gérer l'agenda (créer des créneaux, confirmer,
-- annuler) qu'au pasteur concerné lui-même ou à org_admin/super_admin
-- (organization.manage). Besoin exprimé : pouvoir déléguer la gestion de
-- l'agenda à un "responsable" (ex. secrétariat pastoral) SANS lui donner le
-- rôle `pastor` complet (qui ouvrirait aussi pastoral_care.*, members.write,
-- etc. — bien plus que la simple gestion d'un agenda) et SANS le promouvoir
-- org_admin (qui ouvrirait tout le reste de l'organisation).
--
-- D'où une table de délégation dédiée plutôt qu'un nouveau rôle RBAC global :
-- `pastoral_appointment_managers` accorde une capacité étroite et retirable
-- individuellement, à la manière de `assigned_to` sur pastoral_records (0011)
-- mais en plus explicite (liste gérée, pas juste un champ libre). Écriture
-- réservée à organization.manage — décider QUI peut gérer l'agenda pastoral
-- reste une décision d'administration d'organisation, pas quelque chose
-- qu'un pasteur pourrait s'accorder à lui-même ou à un tiers.

create table pastoral_appointment_managers (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table pastoral_appointment_managers enable row level security;

create policy pastoral_appointment_managers_select on pastoral_appointment_managers for select
  to authenticated using (
    is_org_member(organization_id)
    and (user_id = auth.uid() or has_permission(organization_id, 'organization.manage'))
  );
create policy pastoral_appointment_managers_write on pastoral_appointment_managers for all
  to authenticated
  using (is_org_member(organization_id) and has_permission(organization_id, 'organization.manage'))
  with check (has_permission(organization_id, 'organization.manage'));

create function is_pastoral_appointment_manager(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from pastoral_appointment_managers pam
    where pam.organization_id = org_id and pam.user_id = auth.uid()
  );
$$;

-- Remplace les 4 policies staff de 0025 : ajoute is_pastoral_appointment_manager()
-- comme troisième voie d'accès (en plus de "c'est mon créneau" et
-- "organization.manage"), ET referme un trou de la version précédente — le
-- INSERT/UPDATE with-check acceptait `pastor_user_id = auth.uid()` seul, ce
-- qui aurait permis à N'IMPORTE QUEL membre du staff (même sans le rôle
-- pastor) de créer un créneau en se désignant lui-même comme pasteur. Corrigé
-- ici en exigeant aussi pastoral_appointments.write sur cette branche
-- spécifique — les branches organization.manage et manager délégué, elles,
-- n'en ont pas besoin (c'est précisément leur rôle de gérer l'agenda
-- d'autrui).
drop policy pastoral_appointment_slots_select_staff on pastoral_appointment_slots;
drop policy pastoral_appointment_slots_insert_staff on pastoral_appointment_slots;
drop policy pastoral_appointment_slots_update_staff on pastoral_appointment_slots;
drop policy pastoral_appointment_slots_delete_staff on pastoral_appointment_slots;

create policy pastoral_appointment_slots_select_staff on pastoral_appointment_slots for select
  to authenticated using (
    is_org_member(organization_id) and (
      pastor_user_id = auth.uid()
      or has_permission(organization_id, 'organization.manage')
      or is_pastoral_appointment_manager(organization_id)
    )
  );
create policy pastoral_appointment_slots_insert_staff on pastoral_appointment_slots for insert
  to authenticated with check (
    is_org_member(organization_id) and (
      (has_permission(organization_id, 'pastoral_appointments.write') and pastor_user_id = auth.uid())
      or has_permission(organization_id, 'organization.manage')
      or is_pastoral_appointment_manager(organization_id)
    )
  );
create policy pastoral_appointment_slots_update_staff on pastoral_appointment_slots for update
  to authenticated using (
    is_org_member(organization_id) and (
      pastor_user_id = auth.uid()
      or has_permission(organization_id, 'organization.manage')
      or is_pastoral_appointment_manager(organization_id)
    )
  )
  with check (
    (has_permission(organization_id, 'pastoral_appointments.write') and pastor_user_id = auth.uid())
    or has_permission(organization_id, 'organization.manage')
    or is_pastoral_appointment_manager(organization_id)
  );
create policy pastoral_appointment_slots_delete_staff on pastoral_appointment_slots for delete
  to authenticated using (
    is_org_member(organization_id) and (
      pastor_user_id = auth.uid()
      or has_permission(organization_id, 'organization.manage')
      or is_pastoral_appointment_manager(organization_id)
    )
  );
