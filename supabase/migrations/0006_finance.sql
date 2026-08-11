-- MAKAV ChurchOS — Incrément 5 : Finances (comptes, transactions, dépenses)
-- Ledger simple entrée (pas de partie double) — voir docs/architecture/finance.md.

create table accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  name text not null,
  type text not null default 'bank', -- bank|cash|mobile_money
  currency text not null,
  opening_balance numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table transaction_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  name text not null,
  parent_category_id uuid references transaction_categories(id)
);

create unique index transaction_categories_org_kind_name_uq
  on transaction_categories (organization_id, kind, lower(name));

create type transaction_status as enum ('draft', 'posted', 'void');

create table transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  account_id uuid not null references accounts(id),
  category_id uuid not null references transaction_categories(id),
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null,
  occurred_on date not null,
  description text,
  status transaction_status not null default 'posted',
  expense_id uuid, -- FK ajoutée plus bas (dépendance circulaire avec expenses)
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index transactions_organization_id_idx on transactions (organization_id);
create index transactions_account_id_idx on transactions (account_id);
create index transactions_occurred_on_idx on transactions (occurred_on);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  department_id uuid references departments(id) on delete set null,
  category_id uuid not null references transaction_categories(id),
  vendor text,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null,
  description text,
  receipt_file_path text,
  status text not null default 'pending_approval', -- draft|pending_approval|approved|rejected|paid
  requested_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index expenses_organization_id_idx on expenses (organization_id);

alter table transactions
  add constraint transactions_expense_id_fkey foreign key (expense_id) references expenses(id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table accounts enable row level security;
alter table transaction_categories enable row level security;
alter table transactions enable row level security;
alter table expenses enable row level security;

create policy accounts_select on accounts for select
  to authenticated using (is_org_member(organization_id));
create policy accounts_write on accounts for all
  to authenticated
  using (is_org_member(organization_id) and has_permission(organization_id, 'finance.accounts.write'))
  with check (has_permission(organization_id, 'finance.accounts.write'));

create policy transaction_categories_select on transaction_categories for select
  to authenticated using (is_org_member(organization_id));
create policy transaction_categories_write on transaction_categories for all
  to authenticated
  using (is_org_member(organization_id) and has_permission(organization_id, 'finance.accounts.write'))
  with check (has_permission(organization_id, 'finance.accounts.write'));

create policy transactions_select on transactions for select
  to authenticated using (is_org_member(organization_id));
create policy transactions_insert on transactions for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'finance.transactions.write'));
create policy transactions_update on transactions for update
  to authenticated using (is_org_member(organization_id)) with check (has_permission(organization_id, 'finance.transactions.write'));

create policy expenses_select on expenses for select
  to authenticated using (is_org_member(organization_id));
create policy expenses_insert on expenses for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'finance.expenses.write'));
create policy expenses_update on expenses for update
  to authenticated using (is_org_member(organization_id))
  with check (
    has_permission(organization_id, 'finance.expenses.write')
    or has_permission(organization_id, 'finance.expenses.approve')
  );

-- ---------------------------------------------------------------------------
-- RPC : approbation / paiement (SECURITY DEFINER — vérifie les permissions en
-- interne, seul chemin pour faire transiter le statut et poster la transaction
-- correspondante de façon atomique).
-- ---------------------------------------------------------------------------

create function approve_expense(target_expense_id uuid, approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
begin
  select organization_id into target_org_id from expenses where id = target_expense_id;
  if target_org_id is null then
    raise exception 'Dépense introuvable';
  end if;

  if not has_permission(target_org_id, 'finance.expenses.approve') then
    raise exception 'Permission refusée';
  end if;

  update expenses
  set status = case when approve then 'approved' else 'rejected' end,
      approved_by = auth.uid(),
      approved_at = now()
  where id = target_expense_id and status = 'pending_approval';
end;
$$;

create function mark_expense_paid(target_expense_id uuid, target_account_id uuid, occurred_on date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  exp record;
  new_transaction_id uuid;
begin
  select * into exp from expenses where id = target_expense_id;
  if exp is null then
    raise exception 'Dépense introuvable';
  end if;

  if not has_permission(exp.organization_id, 'finance.expenses.write') then
    raise exception 'Permission refusée';
  end if;

  if exp.status <> 'approved' then
    raise exception 'Seule une dépense approuvée peut être marquée payée';
  end if;

  insert into transactions (
    organization_id, site_id, account_id, category_id, type, amount, currency,
    occurred_on, description, expense_id, created_by
  ) values (
    exp.organization_id, exp.site_id, target_account_id, exp.category_id, 'expense', exp.amount,
    exp.currency, occurred_on, exp.description, exp.id, auth.uid()
  )
  returning id into new_transaction_id;

  update expenses set status = 'paid', paid_at = now() where id = target_expense_id;

  return new_transaction_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catégories par défaut (même pattern que seed_default_event_types)
-- ---------------------------------------------------------------------------

create function seed_default_transaction_categories(target_org_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into transaction_categories (organization_id, kind, name) values
    (target_org_id, 'income', 'Dîmes'),
    (target_org_id, 'income', 'Offrandes'),
    (target_org_id, 'income', 'Dons'),
    (target_org_id, 'income', 'Autres recettes'),
    (target_org_id, 'expense', 'Loyer et charges'),
    (target_org_id, 'expense', 'Salaires'),
    (target_org_id, 'expense', 'Fournitures'),
    (target_org_id, 'expense', 'Communication'),
    (target_org_id, 'expense', 'Événements'),
    (target_org_id, 'expense', 'Maintenance'),
    (target_org_id, 'expense', 'Autres dépenses')
  on conflict (organization_id, kind, lower(name)) do nothing;
$$;

select seed_default_transaction_categories(id) from organizations;

create or replace function create_organization(
  org_name text,
  org_timezone text default 'Africa/Douala',
  org_currency text default 'XAF'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  new_site_id uuid;
  admin_role_id uuid;
  org_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  org_slug := lower(regexp_replace(trim(org_name), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substr(md5(random()::text), 1, 6);

  insert into organizations (name, slug, timezone, currency)
  values (org_name, org_slug, org_timezone, org_currency)
  returning id into new_org_id;

  insert into sites (organization_id, type, name)
  values (new_org_id, 'church', org_name)
  returning id into new_site_id;

  select id into admin_role_id from roles where code = 'org_admin' and organization_id is null;

  insert into memberships (organization_id, user_id, site_id, role_id, status)
  values (new_org_id, auth.uid(), new_site_id, admin_role_id, 'active');

  perform seed_default_event_types(new_org_id);
  perform seed_default_transaction_categories(new_org_id);

  return new_org_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Stockage des justificatifs de dépense
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy receipts_select on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy receipts_insert on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and has_permission((storage.foldername(name))[1]::uuid, 'finance.expenses.write')
  );
