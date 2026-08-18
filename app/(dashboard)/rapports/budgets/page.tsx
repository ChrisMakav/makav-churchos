import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import { BUDGET_STATUS_OPTIONS } from "@/lib/validation/budgets";
import { cn } from "@/lib/utils";

const STATUS_LABEL = Object.fromEntries(BUDGET_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  active: "default",
  closed: "secondary",
};

function thresholdTone(pct: number) {
  if (pct >= 90) return { bar: "bg-destructive", text: "text-destructive" };
  if (pct >= 70) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-success", text: "text-success" };
}

export default async function RapportBudgetsPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const [{ data: org }, { data: budgets }] = await Promise.all([
    supabase.from("organizations").select("currency").eq("id", organizationId).single(),
    supabase
      .from("budgets")
      .select("id, name, fiscal_year, status")
      .eq("organization_id", organizationId)
      .order("fiscal_year", { ascending: false }),
  ]);

  const currency = org?.currency ?? "XAF";

  if (!budgets || budgets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapport — Budgets" />
        <EmptyState
          title="Aucun budget"
          description="Créez un budget annuel pour suivre les dépenses par catégorie."
        />
      </div>
    );
  }

  const { data: lines } = await supabase
    .from("budget_lines")
    .select("id, budget_id, allocated_amount, transaction_categories(name), departments(name)")
    .in(
      "budget_id",
      budgets.map((b) => b.id),
    );

  // budget_line_actuals est une vue (pas de FK physique) : PostgREST ne peut
  // pas l'embarquer via budget_lines(...) — même contournement que
  // budgets/[id]/page.tsx (requête séparée fusionnée en JS).
  const lineIds = (lines ?? []).map((l) => l.id);
  const { data: actuals } = lineIds.length
    ? await supabase.from("budget_line_actuals").select("budget_line_id, spent_amount").in("budget_line_id", lineIds)
    : { data: [] as { budget_line_id: string; spent_amount: number }[] };
  const spentByLine = new Map((actuals ?? []).map((a) => [a.budget_line_id, Number(a.spent_amount)]));

  const linesByBudget = new Map<string, typeof lines>();
  for (const line of lines ?? []) {
    const list = linesByBudget.get(line.budget_id) ?? [];
    list.push(line);
    linesByBudget.set(line.budget_id, list);
  }

  const activeBudgets = budgets.filter((b) => b.status === "active");
  const activeLineIds = new Set(
    (lines ?? []).filter((l) => activeBudgets.some((b) => b.id === l.budget_id)).map((l) => l.id),
  );
  const totalAllocatedActive = (lines ?? [])
    .filter((l) => activeLineIds.has(l.id))
    .reduce((s, l) => s + Number(l.allocated_amount), 0);
  const totalSpentActive = Array.from(activeLineIds).reduce((s, id) => s + (spentByLine.get(id) ?? 0), 0);
  const pctActive = totalAllocatedActive > 0 ? (totalSpentActive / totalAllocatedActive) * 100 : 0;

  const orderedBudgets = [...budgets].sort((a, b) => {
    const order: Record<string, number> = { active: 0, draft: 1, closed: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Rapport — Budgets" description="Allocations et consommation par ligne budgétaire." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Budgets actifs" value={activeBudgets.length} />
        <StatCard label="Alloué (actifs)" value={formatCurrency(totalAllocatedActive, currency)} />
        <StatCard label="Dépensé (actifs)" value={formatCurrency(totalSpentActive, currency)} />
        <StatCard
          label="Consommation (actifs)"
          value={`${Math.round(pctActive)} %`}
          hintTone={pctActive >= 90 ? "destructive" : pctActive >= 70 ? "warning" : "success"}
        />
      </div>

      <div className="space-y-4">
        {orderedBudgets.map((budget) => {
          const budgetLines = linesByBudget.get(budget.id) ?? [];
          const totalAllocated = budgetLines.reduce((s, l) => s + Number(l.allocated_amount), 0);
          const totalSpent = budgetLines.reduce((s, l) => s + (spentByLine.get(l.id) ?? 0), 0);

          return (
            <Card key={budget.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-lg">{budget.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">Exercice {budget.fiscal_year}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(totalSpent, currency)} / {formatCurrency(totalAllocated, currency)}
                  </span>
                  <Badge variant={STATUS_VARIANT[budget.status] ?? "outline"}>
                    {STATUS_LABEL[budget.status] ?? budget.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {budgetLines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune ligne budgétaire.</p>
                ) : (
                  <div className="space-y-3">
                    {budgetLines.map((line) => {
                      const spent = spentByLine.get(line.id) ?? 0;
                      const allocated = Number(line.allocated_amount);
                      const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
                      const tone = thresholdTone(pct);
                      return (
                        <div key={line.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">
                              {line.transaction_categories?.name ?? "—"}
                              {line.departments?.name ? (
                                <span className="text-muted-foreground"> · {line.departments.name}</span>
                              ) : null}
                            </span>
                            <span className={cn("text-xs font-medium", tone.text)}>{Math.round(pct)} %</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", tone.bar)}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
