-- MAKAV ChurchOS — Portail membre : lecture du nom de l'organisation
--
-- is_org_member() (0001) ne vérifie que les memberships staff — un membre
-- pur (sans accès staff, voir 0020_member_portal.sql) ne peut donc pas lire
-- sa propre ligne organizations via la policy organizations_select
-- existante. Conséquence concrète : `getMemberSession()` (lib/member-session.ts)
-- fait un join `organizations(name)` qui revient null pour lui, et
-- `(member)/mon-espace/page.tsx` affiche un sous-titre vide à la place du
-- nom de l'église.
--
-- Policy additive (OR avec organizations_select existante, même pattern que
-- 0020) : un membre peut lire uniquement l'organisation à laquelle sa fiche
-- members est rattachée.
create policy organizations_select_member on organizations for select
  to authenticated using (
    exists (select 1 from members m where m.organization_id = organizations.id and m.user_id = auth.uid())
  );
