import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { BarList } from "@/components/patterns/bar-list";
import { MonthlyBars } from "@/components/patterns/monthly-bars";
import { EmptyState } from "@/components/patterns/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { MEMBER_STATUS_OPTIONS, GENDER_OPTIONS } from "@/lib/validation/members";
import { AGE_BRACKETS, ageFromBirthDate, dateToMonthKey, lastMonths } from "@/lib/reports";

const STATUS_LABEL = Object.fromEntries(MEMBER_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const GENDER_LABEL = Object.fromEntries(GENDER_OPTIONS.map((o) => [o.value, o.label]));

export default async function RapportMembresPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();
  const hasDepartmentsAccess = session.activeOrg.permissions.includes("departments.read");

  const [{ data: members }, { count: familiesCount }, departmentRows] = await Promise.all([
    supabase
      .from("members")
      .select("id, member_status, gender, birth_date, join_date, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("families")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    hasDepartmentsAccess
      ? supabase
          .from("department_members")
          .select("member_id, departments!inner(name, organization_id)")
          .eq("departments.organization_id", organizationId)
      : Promise.resolve({ data: null }),
  ]);

  const rows = members ?? [];

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapport — Membres" />
        <EmptyState
          title="Aucun membre enregistré"
          description="Ce rapport se remplira au fur et à mesure que vous ajoutez des membres."
        />
      </div>
    );
  }

  const activeCount = rows.filter((m) => m.member_status === "active").length;
  const visitorCount = rows.filter((m) => m.member_status === "visitor").length;

  const statusCounts = new Map<string, number>();
  const genderCounts = new Map<string, number>();
  const ageCounts = new Map<string, number>();

  for (const m of rows) {
    statusCounts.set(m.member_status, (statusCounts.get(m.member_status) ?? 0) + 1);

    const genderKey = m.gender ?? "unknown";
    genderCounts.set(genderKey, (genderCounts.get(genderKey) ?? 0) + 1);

    const bracketLabel = m.birth_date
      ? (AGE_BRACKETS.find((b) => {
          const age = ageFromBirthDate(m.birth_date!);
          return age >= b.min && age <= b.max;
        })?.label ?? "Âge inconnu")
      : "Âge inconnu";
    ageCounts.set(bracketLabel, (ageCounts.get(bracketLabel) ?? 0) + 1);
  }

  const months = lastMonths(12);
  const growthByMonth = new Map<string, number>();
  for (const m of rows) {
    const refDate = m.join_date ?? m.created_at;
    if (!refDate) continue;
    const key = dateToMonthKey(refDate);
    growthByMonth.set(key, (growthByMonth.get(key) ?? 0) + 1);
  }

  const departmentCounts = new Map<string, number>();
  for (const row of departmentRows.data ?? []) {
    const name = row.departments?.name ?? "—";
    departmentCounts.set(name, (departmentCounts.get(name) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport — Membres"
        description="Composition et évolution de votre communauté."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total membres" value={rows.length} />
        <StatCard label="Membres actifs" value={activeCount} />
        <StatCard label="Visiteurs" value={visitorCount} />
        <StatCard label="Familles" value={familiesCount ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Nouveaux membres (12 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBars
            points={months.map((m) => ({
              label: m.label,
              values: { count: growthByMonth.get(m.key) ?? 0 },
            }))}
            series={[{ key: "count", label: "Nouveaux membres", colorClass: "bg-primary" }]}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={Array.from(statusCounts.entries()).map(([status, value]) => ({
                label: STATUS_LABEL[status] ?? status,
                value,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Par genre</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={Array.from(genderCounts.entries()).map(([gender, value]) => ({
                label: gender === "unknown" ? "Non renseigné" : (GENDER_LABEL[gender] ?? gender),
                value,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Par tranche d&apos;âge</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={[...AGE_BRACKETS.map((b) => b.label), "Âge inconnu"]
                .map((label) => ({ label, value: ageCounts.get(label) ?? 0 }))
                .filter((i) => i.value > 0)}
            />
          </CardContent>
        </Card>

        {hasDepartmentsAccess ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Par département</CardTitle>
            </CardHeader>
            <CardContent>
              <BarList
                items={Array.from(departmentCounts.entries())
                  .map(([label, value]) => ({ label, value }))
                  .sort((a, b) => b.value - a.value)}
                emptyLabel="Aucun membre affecté à un département."
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
