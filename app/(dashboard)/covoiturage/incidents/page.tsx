import Link from "next/link";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { CARPOOL_INCIDENT_TYPES } from "@/lib/validation/covoiturage";
import { IncidentStatusButton } from "./incident-status-button";

export default async function CovoiturageIncidentsPage() {
  const session = await getSession();
  if (!session) return null;
  const organizationId = session.activeOrg.organizationId;

  const supabase = await createClient();
  const { data: incidents } = await supabase
    .from("carpool_incidents")
    .select(
      "id, ride_id, incident_type, description, status, created_at, members(first_name, last_name), carpool_rides(departure_label, destination_label)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  const rows = incidents ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description={`${rows.filter((r) => r.status === "open").length} incident(s) ouvert(s).`}
      />

      {rows.length === 0 ? (
        <EmptyState title="Aucun incident" description="Aucun incident n'a été signalé sur un trajet de covoiturage." />
      ) : (
        <div className="space-y-2">
          {rows.map((inc) => (
            <div key={inc.id} className="rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {CARPOOL_INCIDENT_TYPES.find((t) => t.value === inc.incident_type)?.label ?? inc.incident_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Signalé par {inc.members ? `${inc.members.first_name} ${inc.members.last_name}` : "—"} le{" "}
                    {formatDateTime(inc.created_at)}
                  </p>
                  {inc.carpool_rides ? (
                    <Link href={`/covoiturage/trajets/${inc.ride_id}`} className="text-xs text-primary hover:underline">
                      {inc.carpool_rides.departure_label} → {inc.carpool_rides.destination_label}
                    </Link>
                  ) : null}
                </div>
                <Badge variant={inc.status === "open" ? "destructive" : "outline"}>{inc.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-foreground">{inc.description}</p>
              <div className="mt-2">
                <IncidentStatusButton organizationId={organizationId} incidentId={inc.id} status={inc.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
