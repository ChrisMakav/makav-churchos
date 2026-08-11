import { PageHeader } from "@/components/patterns/page-header";
import { getSession } from "@/lib/session";
import { BudgetCreateForm } from "./budget-create-form";

export default async function NouveauBudgetPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau budget" />
      <BudgetCreateForm organizationId={session.activeOrg.organizationId} />
    </div>
  );
}
