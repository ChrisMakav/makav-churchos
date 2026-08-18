-- MAKAV ChurchOS — Reçus fiscaux annuels
--
-- Le reçu par don (0007, create_donation) sert de preuve immédiate mais la
-- pratique fiscale courante (France/Québec) consiste à émettre UN reçu
-- consolidé par donateur et par année civile, récapitulant l'ensemble de ses
-- dons. C'est ce que génère generate_annual_receipts ci-dessous : un batch,
-- déclenché manuellement, un donateur = un reçu = un numéro (même séquence
-- next_receipt_number que les reçus unitaires, un seul espace de numérotation
-- légal par organisation/année).
--
-- Une fois émis, un reçu annuel n'est jamais recalculé silencieusement (pas
-- d'upsert sur le montant) : relancer la génération complète seulement les
-- donateurs pas encore couverts pour l'année. Un don supplémentaire après
-- émission nécessiterait un nouveau cycle (hors-scope P1), pas une
-- réécriture rétroactive du reçu déjà remis.

create table annual_donation_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  fiscal_year integer not null,
  total_amount numeric(14,2) not null,
  donation_count integer not null,
  receipt_number text not null,
  issued_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, member_id, fiscal_year)
);

create index annual_donation_receipts_org_year_idx on annual_donation_receipts (organization_id, fiscal_year);

alter table annual_donation_receipts enable row level security;

create policy annual_donation_receipts_select on annual_donation_receipts for select
  to authenticated using (is_org_member(organization_id));

-- Pas de policy insert/update client : uniquement via generate_annual_receipts,
-- pour garantir la numérotation officielle et l'unicité par donateur/année.

create function generate_annual_receipts(target_org_id uuid, target_year integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  donor record;
  generated_count integer := 0;
begin
  if not has_permission(target_org_id, 'donations.write') then
    raise exception 'Permission refusée';
  end if;

  for donor in
    select d.member_id, sum(d.amount) as total_amount, count(*) as donation_count
    from donations d
    where d.organization_id = target_org_id
      and d.member_id is not null
      and d.is_anonymous = false
      and extract(year from d.given_at) = target_year
    group by d.member_id
  loop
    if not exists (
      select 1 from annual_donation_receipts r
      where r.organization_id = target_org_id
        and r.member_id = donor.member_id
        and r.fiscal_year = target_year
    ) then
      insert into annual_donation_receipts (
        organization_id, member_id, fiscal_year, total_amount, donation_count, receipt_number, created_by
      ) values (
        target_org_id, donor.member_id, target_year, donor.total_amount, donor.donation_count,
        next_receipt_number(target_org_id), auth.uid()
      );
      generated_count := generated_count + 1;
    end if;
  end loop;

  return generated_count;
end;
$$;
