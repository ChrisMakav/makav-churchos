import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { BUDGET_STATUS_OPTIONS } from "@/lib/validation/budgets";

const STATUS_LABEL = Object.fromEntries(BUDGET_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  active: "default",
  closed: "secondary",
};

export default async function BudgetsPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: budgets } = await supabase
    .from("budgets")
    .select("id, name, fiscal_year, status")
    .eq("organization_id", session.activeOrg.organizationId)
    .order("fiscal_year", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        actions={
          <Button render={<Link href="/budgets/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouveau budget
          </Button>
        }
      />

      {!budgets || budgets.length === 0 ? (
        <EmptyState
          title="Aucun budget"
          description="Créez le budget annuel de votre église pour suivre les dépenses par catégorie."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Link key={budget.id} href={`/budgets/${budget.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-heading text-lg">{budget.name}</CardTitle>
                  <Badge variant={STATUS_VARIANT[budget.status] ?? "outline"}>
                    {STATUS_LABEL[budget.status] ?? budget.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Exercice {budget.fiscal_year}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
