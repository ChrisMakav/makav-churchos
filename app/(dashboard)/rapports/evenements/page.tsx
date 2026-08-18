import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { BarList } from "@/components/patterns/bar-list";
import { MonthlyBars } from "@/components/patterns/monthly-bars";
import { EmptyState } from "@/components/patterns/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { dateToMonthKey, lastMonths } from "@/lib/reports";

export default async function RapportEvenementsPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, starts_at, status, event_types(label_fr)")
    .eq("organization_id", organizationId);

  const rows = events ?? [];

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapport — Événements" />
        <EmptyState
          title="Aucun événement enregistré"
          description="Ce rapport se remplira dès que des événements seront planifiés."
        />
      </div>
    );
  }

  const now = new Date().toISOString();
  const upcomingCount = rows.filter((e) => e.status === "scheduled" && e.starts_at >= now).length;
  const completedCount = rows.filter((e) => e.status === "completed").length;
  const cancelledCount = rows.filter((e) => e.status === "cancelled").length;

  const months = lastMonths(12);
  const byMonth = new Map<string, number>();
  for (const e of rows) {
    const key = dateToMonthKey(e.starts_at);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  const byType = new Map<string, number>();
  for (const e of rows) {
    const label = e.event_types?.label_fr ?? "Sans type";
    byType.set(label, (byType.get(label) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Rapport — Événements" description="Activité et répartition de votre calendrier." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total événements" value={rows.length} />
        <StatCard label="À venir" value={upcomingCount} />
        <StatCard label="Réalisés" value={completedCount} />
        <StatCard label="Annulés" value={cancelledCount} hintTone={cancelledCount > 0 ? "warning" : "neutral"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Événements par mois (12 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBars
            points={months.map((m) => ({ label: m.label, values: { count: byMonth.get(m.key) ?? 0 } }))}
            series={[{ key: "count", label: "Événements", colorClass: "bg-accent" }]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Par type</CardTitle>
        </CardHeader>
        <CardContent>
          <BarList
            items={Array.from(byType.entries())
              .map(([label, value]) => ({ label, value }))
              .sort((a, b) => b.value - a.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
