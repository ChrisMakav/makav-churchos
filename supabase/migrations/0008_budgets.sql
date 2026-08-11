-- MAKAV ChurchOS — Incrément 7 : Budgets + alertes de seuil
-- Crée aussi `notifications`, nécessaire dès cet incrément pour le cron
-- d'alertes (l'incrément 8 se contente d'en finaliser l'UI).

create table budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  fiscal_year integer not null,
  name text not null,
  status text not null default 'draft', -- draft|active|closed
  created_at timestamptz not null default now(),
  unique (organization_id, site_id, fiscal_year)
);

create table budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  category_id uuid not null references transaction_categories(id),
  department_id uuid references departments(id) on delete set null,
  allocated_amount numeric(14,2) not null check (allocated_amount >= 0)
);

create index budget_lines_budget_id_idx on budget_lines (budget_id);

-- Complète transactions/expenses (incrément 5) : lien optionnel vers la ligne
-- budgétaire imputée, posé maintenant que budget_lines existe.
alter table transactions add column budget_line_id uuid references budget_lines(id) on delete set null;
alter table expenses add column budget_line_id uuid references budget_lines(id) on delete set null;

create or replace function mark_expense_paid(target_expense_id uuid, target_account_id uuid, occurred_on date)
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
    occurred_on, description, expense_id, budget_line_id, created_by
  ) values (
    exp.organization_id, exp.site_id, target_account_id, exp.category_id, 'expense', exp.amount,
    exp.currency, occurred_on, exp.description, exp.id, exp.budget_line_id, auth.uid()
  )
  returning id into new_transaction_id;

  update expenses set status = 'paid', paid_at = now() where id = target_expense_id;

  return new_transaction_id;
end;
$$;

-- Vue calculée : consommé par ligne budgétaire (dépenses postées uniquement).
create view budget_line_actuals as
  select
    bl.id as budget_line_id,
    bl.budget_id,
    bl.allocated_amount,
    coalesce(sum(t.amount) filter (where t.type = 'expense' and t.status = 'posted'), 0) as spent_amount
  from budget_lines bl
  left join transactions t on t.budget_line_id = bl.id
  group by bl.id, bl.budget_id, bl.allocated_amount;

-- Idempotence des alertes 70/90/100 % : une ligne par (budget_line, seuil)
-- déjà franchi, pour ne jamais notifier deux fois le même dépassement.
create table budget_alerts_sent (
  budget_line_id uuid not null references budget_lines(id) on delete cascade,
  threshold integer not null check (threshold in (70, 90, 100)),
  sent_at timestamptz not null default now(),
  primary key (budget_line_id, threshold)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on notifications (user_id);

alter table budgets enable row level security;
alter table budget_lines enable row level security;
alter table budget_alerts_sent enable row level security;
alter table notifications enable row level security;

create policy budgets_select on budgets for select
  to authenticated using (is_org_member(organization_id));
create policy budgets_write on budgets for all
  to authenticated
  using (is_org_member(organization_id) and has_permission(organization_id, 'budgets.write'))
  with check (has_permission(organization_id, 'budgets.write'));

-- budget_lines n'a pas organization_id directement : policies via une
-- sous-requête sur budgets (même pattern que department_members).
create policy budget_lines_select on budget_lines for select
  to authenticated using (
    exists (select 1 from budgets b where b.id = budget_lines.budget_id and is_org_member(b.organization_id))
  );
create policy budget_lines_write on budget_lines for all
  to authenticated
  using (
    exists (
      select 1 from budgets b where b.id = budget_lines.budget_id
        and is_org_member(b.organization_id) and has_permission(b.organization_id, 'budgets.write')
    )
  )
  with check (
    exists (
      select 1 from budgets b where b.id = budget_lines.budget_id and has_permission(b.organization_id, 'budgets.write')
    )
  );

create policy budget_alerts_sent_select on budget_alerts_sent for select
  to authenticated using (
    exists (
      select 1 from budget_lines bl
      join budgets b on b.id = bl.budget_id
      where bl.id = budget_alerts_sent.budget_line_id and is_org_member(b.organization_id)
    )
  );

create policy notifications_select on notifications for select
  to authenticated using (user_id = auth.uid());
create policy notifications_update on notifications for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
