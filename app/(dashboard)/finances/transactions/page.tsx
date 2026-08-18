import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { TransactionsList, type TransactionRow } from "./transactions-list";
import { IncomeDialog } from "./income-dialog";

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: transactions }, { data: accounts }, { data: categories }, { data: org }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, occurred_on, description, type, amount, currency, is_reconciled, accounts(name), transaction_categories(name)",
        )
        .eq("organization_id", organizationId)
        .order("occurred_on", { ascending: false }),
      supabase.from("accounts").select("id, name").eq("organization_id", organizationId).order("name"),
      supabase
        .from("transaction_categories")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("kind", "income")
        .order("name"),
      supabase.from("organizations").select("currency").eq("id", organizationId).single(),
    ]);

  const rows: TransactionRow[] = (transactions ?? []).map((t) => ({
    id: t.id,
    occurredOn: t.occurred_on,
    description: t.description,
    categoryName: t.transaction_categories?.name ?? "—",
    accountName: t.accounts?.name ?? "—",
    type: t.type,
    amount: Number(t.amount),
    currency: t.currency,
    isReconciled: t.is_reconciled,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        actions={
          <IncomeDialog
            organizationId={organizationId}
            accounts={accounts ?? []}
            categories={categories ?? []}
            defaultCurrency={org?.currency ?? "XAF"}
          />
        }
      />
      <TransactionsList organizationId={organizationId} rows={rows} />
    </div>
  );
}
