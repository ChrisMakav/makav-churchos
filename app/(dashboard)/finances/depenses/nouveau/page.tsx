import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { ExpenseForm } from "../expense-form";

export default async function NouvelleDepensePage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: categories }, { data: departments }, { data: org }, { data: budgetLines }] =
    await Promise.all([
      supabase
        .from("transaction_categories")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("kind", "expense")
        .order("name"),
      supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
      supabase.from("organizations").select("currency").eq("id", organizationId).single(),
      supabase
        .from("budget_lines")
        .select("id, allocated_amount, transaction_categories(name), budgets!inner(status)")
        .eq("budgets.status", "active"),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Nouvelle dépense" />
      <ExpenseForm
        organizationId={organizationId}
        categories={categories ?? []}
        departments={departments ?? []}
        budgetLines={(budgetLines ?? []).map((b) => ({
          id: b.id,
          label: b.transaction_categories?.name ?? "Ligne budgétaire",
        }))}
        defaultCurrency={org?.currency ?? "XAF"}
      />
    </div>
  );
}
