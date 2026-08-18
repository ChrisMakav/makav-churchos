import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyBars } from "@/components/patterns/monthly-bars";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { lastMonths, dateToMonthKey } from "@/lib/reports";
import { AttendanceList, type AttendanceRow } from "./attendance-list";

export default async function StatistiquesPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: records } = await supabase
    .from("attendance_records")
    .select(
      "id, label, service_date, women_count, men_count, teens_count, children_count, total_count, new_people_count",
    )
    .eq("organization_id", session.activeOrg.organizationId)
    .order("service_date", { ascending: false });

  const rows: AttendanceRow[] = (records ?? []).map((r) => ({
    id: r.id,
    label: r.label,
    serviceDate: r.service_date,
    womenCount: r.women_count,
    menCount: r.men_count,
    teensCount: r.teens_count,
    childrenCount: r.children_count,
    totalCount: r.total_count ?? 0,
    newPeopleCount: r.new_people_count,
  }));

  const latest = rows[0];
  const avgTotal = rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.totalCount, 0) / rows.length) : 0;
  const newPeopleThisYear = rows
    .filter((r) => r.serviceDate.slice(0, 4) === String(new Date().getUTCFullYear()))
    .reduce((sum, r) => sum + r.newPeopleCount, 0);

  const months = lastMonths(6);
  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const key = dateToMonthKey(r.serviceDate);
    byMonth.set(key, (byMonth.get(key) ?? 0) + r.totalCount);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistiques de présence"
        description={`${rows.length} statistique${rows.length > 1 ? "s" : ""} enregistrée${rows.length > 1 ? "s" : ""}.`}
        actions={
          <Button render={<Link href="/statistiques/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouvelle statistique
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dernier total" value={latest ? latest.totalCount : "—"} hint={latest?.label} />
        <StatCard
          label="Répartition (dernier)"
          value={
            latest
              ? `${latest.womenCount}F / ${latest.menCount}H / ${latest.teensCount}A / ${latest.childrenCount}E`
              : "—"
          }
        />
        <StatCard label="Moyenne par culte" value={avgTotal} />
        <StatCard label="Nouvelles personnes (année)" value={newPeopleThisYear} hintTone="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Présence totale (6 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBars
            points={months.map((m) => ({ label: m.label, values: { count: byMonth.get(m.key) ?? 0 } }))}
            series={[{ key: "count", label: "Participants", colorClass: "bg-accent" }]}
          />
        </CardContent>
      </Card>

      <AttendanceList rows={rows} />
    </div>
  );
}
