-- MAKAV ChurchOS — Communication
--
-- Compositeur de campagnes (segments de destinataires + canal + message) et
-- historique des envois. P1 ne branche réellement que le canal "app"
-- (notifications in-app, table déjà existante depuis 0008) — email/sms sont
-- des canaux prévus dans l'UI (voir lib/validation/communications.ts) mais
-- désactivés tant qu'aucun fournisseur (Resend, SMS...) n'est provisionné.
-- Pas de table de segments dédiée : les segments sont résolus à la volée
-- côté application à partir de departments/sites/members existants (voir
-- (dashboard)/communication/actions.ts) — seul le récapitulatif texte
-- (`segment_summary`) est persisté, pour l'affichage dans l'historique même
-- si un département est renommé/supprimé ensuite.

create table communications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  channel text not null default 'app', -- app|email|sms
  title text not null,
  body text not null,
  segment_summary text not null,
  segments jsonb not null default '[]'::jsonb, -- [{type, id, label}] — rejoué par le cron pour les envois programmés
  recipient_count integer not null default 0,
  status text not null default 'scheduled', -- scheduled|sent
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint communications_channel_check check (channel in ('app', 'email', 'sms')),
  constraint communications_status_check check (status in ('scheduled', 'sent'))
);

create index communications_organization_id_idx on communications (organization_id, created_at desc);

-- Rattache les notifications créées par un envoi "app" à la campagne d'origine
-- (nullable — les notifications hors communication, ex. budget_alert déjà en
-- place, ne renseignent pas cette colonne). Permet de calculer un vrai taux
-- de lecture par campagne (read_at) sans table de jointure séparée.
alter table notifications add column communication_id uuid references communications(id) on delete set null;
create index notifications_communication_id_idx on notifications (communication_id);

alter table communications enable row level security;

create policy communications_select on communications for select
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'communications.read'));
create policy communications_insert on communications for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'communications.write'));
create policy communications_update on communications for update
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'communications.read'))
  with check (has_permission(organization_id, 'communications.write'));
create policy communications_delete on communications for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'communications.write'));

-- Nouveau module : étend le catalogue RBAC posé en 0001 (pattern 0010/0012/0018).
insert into permissions (code, description) values
  ('communications.read', 'Consulter les envois de communication'),
  ('communications.write', 'Composer et envoyer des communications')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('communications.read', 'communications.write')
where r.code in ('super_admin', 'org_admin')
on conflict do nothing;

-- communications_manager ("Responsable communication") est seedé depuis 0001
-- sans jamais avoir eu de permission câblée — exactement son périmètre,
-- même situation que volunteer_manager en 0018. pastor y a aussi accès :
-- dans une petite église, c'est souvent lui qui envoie les communications
-- (déjà le cas pour departments/events/budgets.read).
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('communications.read', 'communications.write')
where r.code in ('communications_manager', 'pastor')
on conflict do nothing;
