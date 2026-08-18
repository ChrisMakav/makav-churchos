import Link from "next/link";
import { DownloadIcon, ReceiptIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import { DONATION_METHOD_OPTIONS } from "@/lib/validation/donations";
import { generateAnnualReceipts } from "../dons/actions";

const METHOD_LABEL = Object.fromEntries(DONATION_METHOD_OPTIONS.map((o) => [o.value, o.label]));
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export default async function FinancesPage() {
  const session = await getSession();
  if (!session) return null;
  const organizationId = session.activeOrg.organizationId;

  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const supabase = await createClient();

  const [
    { data: org },
    { data: donationsThisYear },
    { data: donationsLastYear },
    { data: recentDonations },
    { data: projectFunds },
    { count: unreconciledTotal },
    { count: unreconciledThisMonth },
  ] = await Promise.all([
    supabase.from("organizations").select("name, currency").eq("id", organizationId).single(),
    supabase
      .from("donations")
      .select("amount, is_recurring, member_id, is_anonymous")
      .eq("organization_id", organizationId)
      .gte("given_at", `${currentYear}-01-01`)
      .lte("given_at", `${currentYear}-12-31`),
    supabase
      .from("donations")
      .select("amount")
      .eq("organization_id", organizationId)
      .gte("given_at", `${previousYear}-01-01`)
      .lte("given_at", `${previousYear}-12-31`),
    supabase
      .from("donations")
      .select(
        "id, amount, currency, given_at, is_anonymous, method, donation_funds(name), members(first_name, last_name)",
      )
      .eq("organization_id", organizationId)
      .order("given_at", { ascending: false })
      .limit(10),
    supabase
      .from("donation_funds")
      .select("id, name, goal_amount, starts_on, ends_on")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .not("goal_amount", "is", null)
      .order("name"),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "posted")
      .eq("is_reconciled", false),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "posted")
      .eq("is_reconciled", false)
      .gte("occurred_on", monthStart),
  ]);

  const currency = org?.currency ?? "XAF";
  const thisYearRows = donationsThisYear ?? [];
  const lastYearRows = donationsLastYear ?? [];

  const totalThisYear = thisYearRows.reduce((s, d) => s + Number(d.amount), 0);
  const totalLastYear = lastYearRows.reduce((s, d) => s + Number(d.amount), 0);
  const yoyChange = totalLastYear > 0 ? ((totalThisYear - totalLastYear) / totalLastYear) * 100 : null;

  const recurringRows = thisYearRows.filter((d) => d.is_recurring);
  const recurringTotal = recurringRows.reduce((s, d) => s + Number(d.amount), 0);
  const recurringPct = totalThisYear > 0 ? (recurringTotal / totalThisYear) * 100 : 0;

  const average = thisYearRows.length > 0 ? totalThisYear / thisYearRows.length : 0;
  const donationMedian = median(thisYearRows.map((d) => Number(d.amount)));

  const eligibleDonorIds = new Set(
    thisYearRows.filter((d) => d.member_id && !d.is_anonymous).map((d) => d.member_id as string),
  );

  const funds = projectFunds ?? [];
  const fundIds = funds.map((f) => f.id);
  const { data: projectDonations } = fundIds.length
    ? await supabase
        .from("donations")
        .select("fund_id, amount, member_id, is_recurring")
        .eq("organization_id", organizationId)
        .in("fund_id", fundIds)
    : { data: [] as { fund_id: string; amount: number; member_id: string | null; is_recurring: boolean }[] };

  const projects = funds.map((fund) => {
    const rows = (projectDonations ?? []).filter((d) => d.fund_id === fund.id);
    const raised = rows.reduce((s, d) => s + Number(d.amount), 0);
    const recurringDonors = new Set(
      rows.filter((d) => d.is_recurring && d.member_id).map((d) => d.member_id),
    ).size;
    const goal = Number(fund.goal_amount);
    return {
      id: fund.id,
      name: fund.name,
      raised,
      goal,
      pct: goal > 0 ? Math.min(100, (raised / goal) * 100) : 0,
      endsOn: fund.ends_on,
      recurringDonors,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dons & finances"
        description={`Dîmes, offrandes, projets et reçus fiscaux — exercice ${currentYear}`}
        actions={
          <>
            <Button
              variant="outline"
              render={<Link href="/api/rapports/finances/export" />}
              nativeButton={false}
            >
              <DownloadIcon className="h-4 w-4" />
              Export comptable
            </Button>
            <form action={generateAnnualReceipts.bind(null, organizationId, currentYear)}>
              <Button type="submit" disabled={eligibleDonorIds.size === 0}>
                <ReceiptIcon className="h-4 w-4" />
                Générer {eligibleDonorIds.size} reçus fiscaux
              </Button>
            </form>
          </>
        }
      />

      <div className="flex gap-4 text-sm">
        <Link href="/dons/projets" className="text-primary hover:underline">
          Gérer les fonds & projets
        </Link>
        <Link href="/dons/recus-annuels" className="text-primary hover:underline">
          Voir les reçus émis
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Collecté cette année"
          value={formatCurrency(totalThisYear, currency)}
          hint={yoyChange !== null ? `${yoyChange >= 0 ? "+" : ""}${yoyChange.toFixed(0)} % vs ${previousYear}` : undefined}
          hintTone={yoyChange !== null && yoyChange < 0 ? "warning" : "success"}
        />
        <StatCard
          label="Dons récurrents"
          value={recurringRows.length}
          hint={`${recurringPct.toFixed(0)} % du total collecté`}
        />
        <StatCard
          label="Don moyen"
          value={formatCurrency(average, currency)}
          hint={`Médiane ${formatCurrency(donationMedian, currency)}`}
        />
        <StatCard
          label="À rapprocher"
          value={unreconciledTotal ?? 0}
          hint={unreconciledTotal ? "Transactions non rapprochées" : undefined}
          hintTone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Derniers dons enregistrés</CardTitle>
          </CardHeader>
          <CardContent>
            {(recentDonations ?? []).length === 0 ? (
              <EmptyState title="Aucun don enregistré" description="Les dons saisis apparaîtront ici." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donateur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Affectation</TableHead>
                    <TableHead>Moyen</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentDonations ?? []).map((d) => {
                    const donorName = d.is_anonymous
                      ? "Anonyme"
                      : d.members
                        ? `${d.members.first_name} ${d.members.last_name}`
                        : "Non renseigné";
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <Link href={`/dons/${d.id}`} className="font-medium text-foreground hover:underline">
                            {donorName}
                          </Link>
                        </TableCell>
                        <TableCell>{formatCurrency(Number(d.amount), d.currency)}</TableCell>
                        <TableCell className="text-muted-foreground">{d.donation_funds?.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{METHOD_LABEL[d.method] ?? d.method}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {dateFormatter.format(new Date(d.given_at))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Projets en cours</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <EmptyState
                  title="Aucun projet"
                  description="Ajoutez un objectif de collecte à un fonds pour le suivre ici."
                  action={
                    <Button size="sm" render={<Link href="/dons/projets" />} nativeButton={false}>
                      Gérer les fonds & projets
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{project.name}</p>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {formatCurrency(project.raised, currency)} / {formatCurrency(project.goal, currency)}
                        </p>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(project.pct, project.raised > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {project.pct.toFixed(0)} %{" "}
                        {project.endsOn
                          ? `· clôture le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(project.endsOn))}`
                          : project.recurringDonors > 0
                            ? `· ${project.recurringDonors} donateurs récurrents`
                            : null}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Clôture du mois</CardTitle>
            </CardHeader>
            <CardContent>
              {unreconciledThisMonth ? (
                <p className="text-sm text-foreground">
                  Le trésorier doit rapprocher{" "}
                  <Link href="/finances/transactions" className="font-medium underline underline-offset-2">
                    {unreconciledThisMonth} opération{unreconciledThisMonth > 1 ? "s" : ""}
                  </Link>{" "}
                  avant la clôture du mois.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Toutes les opérations du mois sont rapprochées.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
