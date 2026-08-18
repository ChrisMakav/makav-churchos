import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { BarList } from "@/components/patterns/bar-list";
import { MonthlyBars } from "@/components/patterns/monthly-bars";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import { dateToMonthKey, lastMonths } from "@/lib/reports";

export default async function RapportFinancesPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const [{ data: org }, { data: accounts }, { data: transactions }] = await Promise.all([
    supabase.from("organizations").select("currency").eq("id", organizationId).single(),
    supabase
      .from("accounts")
      .select("id, name, opening_balance, currency")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("transactions")
      .select("id, type, amount, occurred_on, account_id, transaction_categories(name)")
      .eq("organization_id", organizationId)
      .eq("status", "posted"),
  ]);

  const currency = org?.currency ?? "XAF";
  const rows = transactions ?? [];

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapport — Finances" />
        <EmptyState
          title="Aucune transaction enregistrée"
          description="Ce rapport se remplira dès que des recettes ou dépenses seront saisies."
        />
      </div>
    );
  }

  const totalIncome = rows.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = rows.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const net = totalIncome - totalExpense;

  const months = lastMonths(12);
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const t of rows) {
    const key = dateToMonthKey(t.occurred_on);
    const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") bucket.income += Number(t.amount);
    if (t.type === "expense") bucket.expense += Number(t.amount);
    byMonth.set(key, bucket);
  }

  const expenseByCategory = new Map<string, number>();
  const incomeByCategory = new Map<string, number>();
  for (const t of rows) {
    const name = t.transaction_categories?.name ?? "Sans catégorie";
    if (t.type === "expense") {
      expenseByCategory.set(name, (expenseByCategory.get(name) ?? 0) + Number(t.amount));
    } else if (t.type === "income") {
      incomeByCategory.set(name, (incomeByCategory.get(name) ?? 0) + Number(t.amount));
    }
  }

  const balanceByAccount = new Map<string, number>();
  for (const t of rows) {
    const delta = t.type === "income" ? Number(t.amount) : t.type === "expense" ? -Number(t.amount) : 0;
    balanceByAccount.set(t.account_id, (balanceByAccount.get(t.account_id) ?? 0) + delta);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport — Finances"
        description="Recettes, dépenses et soldes sur l'ensemble de l'exercice."
        actions={
          <Button
            variant="outline"
            render={<Link href="/api/rapports/finances/export" />}
            nativeButton={false}
          >
            <Download className="h-4 w-4" />
            Exporter en CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total recettes" value={formatCurrency(totalIncome, currency)} hint="Depuis la création" />
        <StatCard label="Total dépenses" value={formatCurrency(totalExpense, currency)} hint="Depuis la création" />
        <StatCard
          label="Solde net"
          value={formatCurrency(net, currency)}
          hintTone={net >= 0 ? "success" : "destructive"}
          hint={net >= 0 ? "Excédentaire" : "Déficitaire"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recettes vs dépenses (12 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBars
            points={months.map((m) => {
              const bucket = byMonth.get(m.key) ?? { income: 0, expense: 0 };
              return { label: m.label, values: { income: bucket.income, expense: bucket.expense } };
            })}
            series={[
              { key: "income", label: "Recettes", colorClass: "bg-success" },
              { key: "expense", label: "Dépenses", colorClass: "bg-destructive" },
            ]}
            formatValue={(v) => formatCurrency(v, currency)}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Dépenses par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={Array.from(expenseByCategory.entries())
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value)}
              formatValue={(v) => formatCurrency(v, currency)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Recettes par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={Array.from(incomeByCategory.entries())
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value)}
              formatValue={(v) => formatCurrency(v, currency)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Soldes par compte</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compte</TableHead>
                <TableHead className="text-right">Solde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(accounts ?? []).map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(
                      account.opening_balance + (balanceByAccount.get(account.id) ?? 0),
                      account.currency,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
