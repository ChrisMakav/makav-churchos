-- MAKAV ChurchOS — Backoffice plateforme
--
-- Panneau d'administration de la plateforme elle-même (pas d'une église en
-- particulier) : liste de toutes les organisations, changement de plan,
-- recherche d'utilisateurs tous organismes confondus. Réservé au rôle
-- `super_admin` (seedé depuis 0001, jamais câblé en UI jusqu'ici — aucun
-- module ne le nécessitait).
--
-- Nouvelle fonction is_super_admin() (même famille que is_org_member/
-- has_permission, 0001) : contrairement à has_permission(org_id, code), pas
-- de paramètre d'organisation — un super_admin voit TOUTES les
-- organisations, pas une seule. Policies additives (permissives, OR avec les
-- policies org-scoped existantes) sur organizations/sites/memberships/
-- profiles : cohérent avec le principe "RLS = frontière de sécurité réelle"
-- (rbac.md) plutôt que de contourner RLS via le client service-role côté
-- application pour ce module.
--
-- Pas d'auto-attribution possible : aucune UI ne permet de désigner un
-- super_admin (ni ici ni ailleurs) — c'est une opération manuelle en base,
-- délibérément hors du produit.

create function is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    join roles r on r.id = m.role_id
    where m.user_id = auth.uid()
      and m.status = 'active'
      and r.code = 'super_admin'
  );
$$;

create policy organizations_select_super_admin on organizations for select
  to authenticated using (is_super_admin());
create policy organizations_update_super_admin on organizations for update
  to authenticated using (is_super_admin()) with check (is_super_admin());

create policy sites_select_super_admin on sites for select
  to authenticated using (is_super_admin());

create policy memberships_select_super_admin on memberships for select
  to authenticated using (is_super_admin());

create policy profiles_select_super_admin on profiles for select
  to authenticated using (is_super_admin());

-- Pour le compteur "membres" du tableau de bord plateforme uniquement (pas
-- d'accès aux fiches individuelles depuis le backoffice en P1).
create policy members_select_super_admin on members for select
  to authenticated using (is_super_admin());
