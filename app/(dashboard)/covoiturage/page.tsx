import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export default async function CovoiturageDashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const organizationId = session.activeOrg.organizationId;

  const supabase = await createClient();
  const [{ data: rides }, { count: openIncidents }, { count: activeDrivers }] = await Promise.all([
    supabase
      .from("carpool_rides")
      .select("status, seat_capacity, seats_available")
      .eq("organization_id", organizationId),
    supabase
      .from("carpool_incidents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "open"),
    supabase
      .from("carpool_driver_availabilities")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true),
  ]);

  const rows = rides ?? [];
  const scheduledCount = rows.filter((r) => r.status === "scheduled").length;
  const completedCount = rows.filter((r) => r.status === "completed").length;
  const cancelledCount = rows.filter((r) => r.status === "cancelled").length;
  const totalSeats = rows.reduce((sum, r) => sum + r.seat_capacity, 0);
  const availableSeats = rows.reduce((sum, r) => sum + r.seats_available, 0);
  const occupiedSeats = totalSeats - availableSeats;
  const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Covoiturage"
        description="Vue d'ensemble de la mobilité partagée de votre église."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Trajets programmés" value={scheduledCount} />
        <StatCard label="Taux d'occupation" value={`${occupancyRate}%`} hint={`${occupiedSeats}/${totalSeats} places`} />
        <StatCard
          label="Incidents ouverts"
          value={openIncidents ?? 0}
          hint={openIncidents ? "Nécessite votre attention" : undefined}
          hintTone={openIncidents ? "warning" : "neutral"}
        />
        <StatCard label="Chauffeurs bénévoles actifs" value={activeDrivers ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Trajets terminés" value={completedCount} />
        <StatCard label="Trajets annulés" value={cancelledCount} />
        <StatCard label="Places disponibles" value={availableSeats} />
      </div>
    </div>
  );
}
