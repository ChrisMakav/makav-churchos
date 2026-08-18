-- MAKAV ChurchOS — Détail par catégorie sur les rapports d'activité de cellule
--
-- 0023_group_reports.sql ne capturait qu'un total de présence
-- (`attendance_count`). Même besoin exprimé pour les cellules que pour les
-- cultes (`attendance_records`, 0022) : détail femmes/hommes/ados/enfants,
-- pas un seul chiffre. Remplace `attendance_count` par les mêmes quatre
-- colonnes + `total_count` généré, exactement le pattern de 0022.

alter table group_reports drop column attendance_count;

alter table group_reports add column women_count integer not null default 0 check (women_count >= 0);
alter table group_reports add column men_count integer not null default 0 check (men_count >= 0);
alter table group_reports add column teens_count integer not null default 0 check (teens_count >= 0);
alter table group_reports add column children_count integer not null default 0 check (children_count >= 0);
alter table group_reports
  add column total_count integer generated always as (women_count + men_count + teens_count + children_count) stored;
