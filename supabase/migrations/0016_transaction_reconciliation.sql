-- MAKAV ChurchOS — Rapprochement bancaire (léger)
--
-- Pas d'import de relevé bancaire ni de rapprochement automatique en P1 :
-- juste un marqueur manuel par transaction ("rapproché avec le relevé
-- bancaire du compte"), posé par le trésorier, pour piloter la clôture du
-- mois (voir docs/architecture/finance.md — limitation déjà documentée).

alter table transactions add column is_reconciled boolean not null default false;
alter table transactions add column reconciled_at timestamptz;
alter table transactions add column reconciled_by uuid references auth.users(id);

create index transactions_is_reconciled_idx on transactions (organization_id, is_reconciled);
