import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_TYPE_OPTIONS } from "@/lib/validation/finance";

const TYPE_LABEL = Object.fromEntries(ACCOUNT_TYPE_OPTIONS.map((o) => [o.value, o.label]));

export default async function ComptesPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: accounts }, { data: transactions }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, currency, opening_balance")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("transactions")
      .select("account_id, type, amount")
      .eq("organization_id", organizationId)
      .eq("status", "posted"),
  ]);

  const balanceByAccount = new Map<string, number>();
  for (const t of transactions ?? []) {
    const delta = t.type === "income" ? Number(t.amount) : -Number(t.amount);
    balanceByAccount.set(t.account_id, (balanceByAccount.get(t.account_id) ?? 0) + delta);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes"
        actions={
          <Button render={<Link href="/finances/comptes/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouveau compte
          </Button>
        }
      />

      {!accounts || accounts.length === 0 ? (
        <EmptyState
          title="Aucun compte"
          description="Ajoutez votre caisse principale ou votre compte bancaire pour commencer."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const balance = account.opening_balance + (balanceByAccount.get(account.id) ?? 0);
            return (
              <Card key={account.id}>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">{account.name}</CardTitle>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {TYPE_LABEL[account.type] ?? account.type}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-3xl text-foreground">
                    {formatCurrency(balance, account.currency)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
