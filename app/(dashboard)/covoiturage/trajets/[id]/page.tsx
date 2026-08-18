import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { CARPOOL_REQUEST_STATUSES } from "@/lib/validation/covoiturage";
import { CancelRideButton } from "./cancel-ride-button";

export default async function StaffRideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const organizationId = session.activeOrg.organizationId;

  const supabase = await createClient();
  const { data: ride } = await supabase
    .from("carpool_rides")
    .select(
      "id, departure_label, destination_label, departs_at, estimated_arrival_at, status, seat_capacity, seats_available, notes, members(first_name, last_name), events(title)",
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!ride) notFound();

  const [{ data: stops }, { data: requests }, { data: incidents }] = await Promise.all([
    supabase
      .from("carpool_ride_stops")
      .select("id, label, address, estimated_time")
      .eq("ride_id", ride.id)
      .order("position_order"),
    supabase
      .from("carpool_ride_requests")
      .select("id, seats_requested, status, members(first_name, last_name)")
      .eq("ride_id", ride.id)
      .order("requested_at", { ascending: false }),
    supabase
      .from("carpool_incidents")
      .select("id, incident_type, description, status, created_at")
      .eq("ride_id", ride.id)
      .order("created_at", { ascending: false }),
  ]);

  const driverName = ride.members ? `${ride.members.first_name} ${ride.members.last_name}` : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${ride.departure_label} → ${ride.destination_label}`}
        description={`Conducteur : ${driverName}${ride.events ? ` · ${ride.events.title}` : ""}`}
        actions={
          ride.status === "scheduled" || ride.status === "in_progress" ? (
            <CancelRideButton organizationId={organizationId} rideId={ride.id} />
          ) : undefined
        }
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Départ</p>
            <p className="text-sm text-foreground">{formatDateTime(ride.departs_at)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Arrivée estimée</p>
            <p className="text-sm text-foreground">
              {ride.estimated_arrival_at ? formatDateTime(ride.estimated_arrival_at) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Places</p>
            <p className="text-sm text-foreground">
              {ride.seat_capacity - ride.seats_available}/{ride.seat_capacity} occupées
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Statut</p>
            <Badge variant="outline">{ride.status}</Badge>
          </div>
          {ride.notes ? (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="text-sm whitespace-pre-wrap text-foreground">{ride.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {stops && stops.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Points d&apos;arrêt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stops.map((stop) => (
              <div key={stop.id} className="rounded-lg border border-border px-4 py-2 text-sm">
                <p className="font-medium text-foreground">{stop.label}</p>
                {stop.address ? <p className="text-xs text-muted-foreground">{stop.address}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Demandes de place</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!requests || requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande pour ce trajet.</p>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2">
                <p className="text-sm text-foreground">
                  {r.members ? `${r.members.first_name} ${r.members.last_name}` : "—"} · {r.seats_requested} place
                  {r.seats_requested > 1 ? "s" : ""}
                </p>
                <Badge variant="outline">
                  {CARPOOL_REQUEST_STATUSES.find((s) => s.value === r.status)?.label ?? r.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incidents liés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!incidents || incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun incident signalé.</p>
          ) : (
            incidents.map((inc) => (
              <div key={inc.id} className="rounded-lg border border-border px-4 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{inc.incident_type}</p>
                  <Badge variant={inc.status === "open" ? "destructive" : "outline"}>{inc.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{inc.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
