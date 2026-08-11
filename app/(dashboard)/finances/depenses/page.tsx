import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { ExpensesList, type ExpenseRow } from "./expenses-list";

export default async function DepensesPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, vendor, amount, currency, status, transaction_categories(name)")
    .eq("organization_id", session.activeOrg.organizationId)
    .order("created_at", { ascending: false });

  const rows: ExpenseRow[] = (expenses ?? []).map((e) => ({
    id: e.id,
    vendor: e.vendor,
    categoryName: e.transaction_categories?.name ?? "—",
    amount: Number(e.amount),
    currency: e.currency,
    status: e.status,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dépenses"
        actions={
          <Button render={<Link href="/finances/depenses/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouvelle dépense
          </Button>
        }
      />
      <ExpensesList rows={rows} />
    </div>
  );
}
