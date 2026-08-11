import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { BudgetLinesPanel, type BudgetLineRow } from "./budget-lines-panel";
import { StatusSelect } from "./status-select";

export default async function BudgetDetailPage({
  params,
}: PageProps<"/budgets/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: budget }, { data: lines }, { data: categories }, { data: departments }, { data: org }] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("id, name, fiscal_year, status")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("budget_lines")
        .select("id, allocated_amount, transaction_categories(name), departments(name)")
        .eq("budget_id", id),
      supabase
        .from("transaction_categories")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("kind", "expense")
        .order("name"),
      supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
      supabase.from("organizations").select("currency").eq("id", organizationId).single(),
    ]);

  if (!budget) notFound();

  // budget_line_actuals est une vue (pas de FK physique) : PostgREST ne peut
  // pas l'embarquer via budget_lines(...). Requête séparée, fusionnée en JS.
  const lineIds = (lines ?? []).map((l) => l.id);
  const { data: actuals } = lineIds.length
    ? await supabase.from("budget_line_actuals").select("budget_line_id, spent_amount").in("budget_line_id", lineIds)
    : { data: [] as { budget_line_id: string; spent_amount: number }[] };
  const spentByLine = new Map((actuals ?? []).map((a) => [a.budget_line_id, Number(a.spent_amount)]));

  const currency = org?.currency ?? "XAF";
  const lineRows: BudgetLineRow[] = (lines ?? []).map((l) => ({
    id: l.id,
    categoryName: l.transaction_categories?.name ?? "—",
    departmentName: l.departments?.name ?? null,
    allocatedAmount: Number(l.allocated_amount),
    spentAmount: spentByLine.get(l.id) ?? 0,
    currency,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={budget.name} description={`Exercice ${budget.fiscal_year}`} />

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Statut :</span>
        <StatusSelect organizationId={organizationId} budgetId={budget.id} status={budget.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Lignes budgétaires</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetLinesPanel
            organizationId={organizationId}
            budgetId={budget.id}
            lines={lineRows}
            categories={categories ?? []}
            departments={departments ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
