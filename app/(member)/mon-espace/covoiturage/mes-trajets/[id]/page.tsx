import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { formatDateTime } from "@/lib/format";
import { RideRequestsPanel, type RideRequestRow } from "./ride-requests-panel";
import { RideStatusActions } from "./ride-status-actions";
import { RideStopsEditor, type RideStopRow } from "./ride-stops-editor";
import { CheckinPanel } from "./checkin-panel";

export default async function MyRideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: ride } = await supabase
    .from("carpool_rides")
    .select(
      "id, departure_label, destination_label, departs_at, estimated_arrival_at, status, seat_capacity, seats_available, notes, auto_confirm",
    )
    .eq("id", id)
    .eq("driver_member_id", session.member.id)
    .maybeSingle();

  if (!ride) notFound();

  const [{ data: stops }, { data: requests }] = await Promise.all([
    supabase
      .from("carpool_ride_stops")
      .select("id, label, address, estimated_time")
      .eq("ride_id", ride.id)
      .order("position_order"),
    supabase
      .from("carpool_ride_requests")
      .select("id, seats_requested, status, message, checked_in_at, no_show, members(first_name, last_name)")
      .eq("ride_id", ride.id)
      .order("requested_at", { ascending: false }),
  ]);

  const stopRows: RideStopRow[] = (stops ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    address: s.address,
  }));

  const requestRows: RideRequestRow[] = (requests ?? []).map((r) => ({
    id: r.id,
    passengerName: r.members ? `${r.members.first_name} ${r.members.last_name}` : "—",
    seatsRequested: r.seats_requested,
    status: r.status,
    message: r.message,
    checkedInAt: r.checked_in_at,
    noShow: r.no_show,
  }));

  const isActive = ride.status === "scheduled" || ride.status === "in_progress";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${ride.departure_label} → ${ride.destination_label}`}
        actions={
          <Button variant="outline" render={<Link href="/mon-espace/covoiturage/mes-trajets" />} nativeButton={false}>
            Retour
          </Button>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Départ</p>
            <p className="text-sm text-foreground">{formatDateTime(ride.departs_at)}</p>
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
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Validation</p>
            <p className="text-sm text-foreground">{ride.auto_confirm ? "Automatique" : "Manuelle"}</p>
          </div>
        </CardContent>
      </Card>

      {isActive ? <RideStatusActions rideId={ride.id} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Points d&apos;arrêt</CardTitle>
        </CardHeader>
        <CardContent>
          <RideStopsEditor rideId={ride.id} stops={stopRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demandes de place</CardTitle>
        </CardHeader>
        <CardContent>
          <RideRequestsPanel requests={requestRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check-in passagers</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckinPanel requests={requestRows.filter((r) => r.status === "confirmed")} />
        </CardContent>
      </Card>

      <div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/mon-espace/covoiturage/incidents/nouveau?ride=${ride.id}`} />}
          nativeButton={false}
        >
          Signaler un incident
        </Button>
      </div>
    </div>
  );
}
