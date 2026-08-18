import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { BarList } from "@/components/patterns/bar-list";
import { MonthlyBars } from "@/components/patterns/monthly-bars";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import { DONATION_METHOD_OPTIONS } from "@/lib/validation/donations";
import { dateToMonthKey, lastMonths } from "@/lib/reports";

const METHOD_LABEL = Object.fromEntries(DONATION_METHOD_OPTIONS.map((o) => [o.value, o.label]));

export default async function RapportDonsPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const [{ data: org }, { data: donations }] = await Promise.all([
    supabase.from("organizations").select("currency").eq("id", organizationId).single(),
    supabase
      .from("donations")
      .select("id, amount, method, given_at, donation_funds(name)")
      .eq("organization_id", organizationId),
  ]);

  const currency = org?.currency ?? "XAF";
  const rows = donations ?? [];

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapport — Dons" />
        <EmptyState
          title="Aucun don enregistré"
          description="Ce rapport se remplira dès que des dons seront saisis."
        />
      </div>
    );
  }

  const total = rows.reduce((s, d) => s + Number(d.amount), 0);
  const average = total / rows.length;

  const months = lastMonths(12);
  const byMonth = new Map<string, number>();
  for (const d of rows) {
    const key = dateToMonthKey(d.given_at);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(d.amount));
  }

  const byFund = new Map<string, number>();
  const byMethod = new Map<string, number>();
  for (const d of rows) {
    const fundName = d.donation_funds?.name ?? "Fonds inconnu";
    byFund.set(fundName, (byFund.get(fundName) ?? 0) + Number(d.amount));
    byMethod.set(d.method, (byMethod.get(d.method) ?? 0) + Number(d.amount));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport — Dons"
        description="Dons et dîmes reçus, par fonds et par mode de paiement."
        actions={
          <Button variant="outline" render={<Link href="/api/rapports/dons/export" />} nativeButton={false}>
            <Download className="h-4 w-4" />
            Exporter en CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total des dons" value={formatCurrency(total, currency)} hint="Depuis la création" />
        <StatCard label="Nombre de dons" value={rows.length} />
        <StatCard label="Don moyen" value={formatCurrency(average, currency)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Dons par mois (12 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBars
            points={months.map((m) => ({ label: m.label, values: { total: byMonth.get(m.key) ?? 0 } }))}
            series={[{ key: "total", label: "Dons", colorClass: "bg-success" }]}
            formatValue={(v) => formatCurrency(v, currency)}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Par fonds</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={Array.from(byFund.entries())
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value)}
              formatValue={(v) => formatCurrency(v, currency)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Par mode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={Array.from(byMethod.entries())
                .map(([method, value]) => ({ label: METHOD_LABEL[method] ?? method, value }))
                .sort((a, b) => b.value - a.value)}
              formatValue={(v) => formatCurrency(v, currency)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
