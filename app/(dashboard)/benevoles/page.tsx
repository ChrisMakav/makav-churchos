import { Fragment } from "react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { RelancerButton } from "./relancer-button";
import { VolunteerCell, type CellSlot, type PoolMember } from "./volunteer-cell";

// La grille couvre les 4 prochains dimanches (glissant, aucune saisie de
// période) — cohérent avec l'usage terrain (planifier ~1 mois de services à
// l'avance) sans introduire de sélecteur de plage à ce stade.
function nextSundays(count: number): string[] {
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dayOfWeek = new Date(todayUtc).getUTCDay(); // 0 = dimanche
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const firstSunday = todayUtc + daysUntilSunday * 86_400_000;

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(firstSunday + i * 7 * 86_400_000);
    return d.toISOString().slice(0, 10);
  });
}

const dateColumnFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function formatColumnLabel(dateIso: string) {
  const label = dateColumnFormatter.format(new Date(`${dateIso}T00:00:00Z`));
  return label.replace(".", "").replace(/^(\w)/, (c) => c.toUpperCase());
}

export default async function BenevolesPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;
  const sundays = nextSundays(4);
  const firstDate = sundays[0]!;
  const lastDate = sundays[sundays.length - 1]!;

  const [{ data: departments }, { data: slotsData }, { data: poolData }] = await Promise.all([
    supabase
      .from("departments")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("volunteer_slots")
      .select("id, department_id, service_date, status, members(id, first_name, last_name)")
      .eq("organization_id", organizationId)
      .gte("service_date", firstDate)
      .lte("service_date", lastDate)
      .order("created_at"),
    supabase
      .from("department_members")
      .select("department_id, members(id, first_name, last_name)")
      .order("member_id"),
  ]);

  const teams = departments ?? [];

  const poolByDepartment = new Map<string, PoolMember[]>();
  for (const row of poolData ?? []) {
    if (!row.members) continue;
    const list = poolByDepartment.get(row.department_id) ?? [];
    list.push({ id: row.members.id, fullName: `${row.members.first_name} ${row.members.last_name}` });
    poolByDepartment.set(row.department_id, list);
  }

  const slotsByCell = new Map<string, CellSlot[]>();
  let vacantCount = 0;
  let pendingCount = 0;
  for (const row of slotsData ?? []) {
    const key = `${row.department_id}__${row.service_date}`;
    const list = slotsByCell.get(key) ?? [];
    list.push({
      id: row.id,
      status: row.status as CellSlot["status"],
      member: row.members
        ? { id: row.members.id, fullName: `${row.members.first_name} ${row.members.last_name}` }
        : null,
    });
    slotsByCell.set(key, list);
    if (row.status === "vacant") vacantCount += 1;
    if (row.status === "pending") pendingCount += 1;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bénévoles & plannings"
        description={`${vacantCount} poste${vacantCount > 1 ? "s" : ""} non pourvu${vacantCount > 1 ? "s" : ""} · ${pendingCount} confirmation${pendingCount > 1 ? "s" : ""} en attente`}
        actions={<RelancerButton organizationId={organizationId} pendingCount={pendingCount} />}
      />

      {teams.length === 0 ? (
        <EmptyState
          title="Aucune équipe"
          description="Créez d'abord des départements (ministères de service) pour pouvoir planifier des bénévoles."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div
            className="grid min-w-[880px]"
            style={{ gridTemplateColumns: `160px repeat(${sundays.length}, minmax(180px, 1fr))` }}
          >
            <div className="border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Équipe
            </div>
            {sundays.map((date) => (
              <div
                key={date}
                className="border-b border-l border-border bg-muted/40 px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase"
              >
                {formatColumnLabel(date)}
              </div>
            ))}

            {teams.map((team, rowIndex) => (
              <Fragment key={team.id}>
                <div
                  className={`flex items-center px-4 py-3 text-sm font-medium text-foreground ${rowIndex > 0 ? "border-t border-border" : ""}`}
                >
                  {team.name}
                </div>
                {sundays.map((date) => (
                  <div
                    key={`${team.id}-${date}`}
                    className={`border-l border-border px-2.5 py-2.5 ${rowIndex > 0 ? "border-t" : ""}`}
                  >
                    <VolunteerCell
                      organizationId={organizationId}
                      departmentId={team.id}
                      serviceDate={date}
                      slots={slotsByCell.get(`${team.id}__${date}`) ?? []}
                      poolMembers={poolByDepartment.get(team.id) ?? []}
                    />
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
