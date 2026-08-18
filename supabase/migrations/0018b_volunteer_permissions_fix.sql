-- Complète 0018_volunteer_scheduling.sql : la table + RLS s'étaient bien
-- appliquées mais ces deux derniers blocs d'insert n'étaient pas passés
-- (paste tronqué côté SQL Editor). ON CONFLICT DO NOTHING pour pouvoir
-- rejouer ce fichier sans risque si jamais une partie était déjà passée.
insert into permissions (code, description) values
  ('volunteers.read', 'Consulter les plannings de bénévoles'),
  ('volunteers.write', 'Affecter/retirer des bénévoles sur les plannings')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('volunteers.read', 'volunteers.write')
where r.code in ('super_admin', 'org_admin')
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('volunteers.read', 'volunteers.write')
where r.code in ('volunteer_manager', 'pastor', 'dept_head')
on conflict do nothing;
