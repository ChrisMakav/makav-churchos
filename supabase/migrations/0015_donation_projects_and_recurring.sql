-- MAKAV ChurchOS — Projets de dons (objectif de collecte) + dons récurrents
--
-- donation_funds sert aujourd'hui uniquement de catégorie comptable plate
-- (Dîme, Offrande, Missions...). On ajoute un objectif de collecte optionnel
-- (goal_amount) et une fenêtre temporelle pour permettre d'afficher certains
-- fonds comme des "projets en cours" avec barre de progression (ex. "Nouvelle
-- salle : 96 400 € / 150 000 €"). Un fonds sans goal_amount reste une simple
-- catégorie comptable, pas un projet — is_active + goal_amount not null
-- déterminent l'affichage dans "Projets en cours".

alter table donation_funds add column goal_amount numeric(14,2);
alter table donation_funds add column starts_on date;
alter table donation_funds add column ends_on date;
alter table donation_funds add column is_active boolean not null default true;

alter table donation_funds add constraint donation_funds_goal_amount_positive
  check (goal_amount is null or goal_amount > 0);

-- Don récurrent : indique que ce don fait partie d'un engagement de don
-- régulier (prélèvement automatique, virement permanent...), indépendamment
-- du moyen de paiement utilisé pour CE don précis.
alter table donations add column is_recurring boolean not null default false;

alter table donations drop constraint donations_method_check;
alter table donations add constraint donations_method_check
  check (method in ('cash', 'check', 'transfer', 'card', 'mobile_money', 'direct_debit'));

-- create_donation (0007) doit maintenant accepter/stocker is_recurring.
create or replace function create_donation(
  target_org_id uuid,
  target_site_id uuid,
  target_account_id uuid,
  target_fund_id uuid,
  target_member_id uuid,
  target_amount numeric,
  target_currency text,
  target_method text,
  target_given_at date,
  target_is_anonymous boolean,
  target_is_recurring boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  donations_category_id uuid;
  new_transaction_id uuid;
  new_donation_id uuid;
  new_receipt_number text;
  fund_name text;
begin
  if not has_permission(target_org_id, 'donations.write') then
    raise exception 'Permission refusée';
  end if;

  select id into donations_category_id
  from transaction_categories
  where organization_id = target_org_id and kind = 'income' and lower(name) = 'dons'
  limit 1;

  if donations_category_id is null then
    raise exception 'Catégorie comptable "Dons" introuvable pour cette organisation';
  end if;

  select name into fund_name from donation_funds where id = target_fund_id;

  insert into transactions (
    organization_id, site_id, account_id, category_id, type, amount, currency,
    occurred_on, description, created_by
  ) values (
    target_org_id, target_site_id, target_account_id, donations_category_id, 'income',
    target_amount, target_currency, target_given_at, coalesce(fund_name, 'Don'), auth.uid()
  )
  returning id into new_transaction_id;

  new_receipt_number := next_receipt_number(target_org_id);

  insert into donations (
    organization_id, site_id, member_id, fund_id, amount, currency, method,
    given_at, is_anonymous, is_recurring, receipt_number, receipt_issued_at, transaction_id, created_by
  ) values (
    target_org_id, target_site_id, target_member_id, target_fund_id, target_amount, target_currency,
    target_method, target_given_at, target_is_anonymous, target_is_recurring, new_receipt_number, now(),
    new_transaction_id, auth.uid()
  )
  returning id into new_donation_id;

  return new_donation_id;
end;
$$;
