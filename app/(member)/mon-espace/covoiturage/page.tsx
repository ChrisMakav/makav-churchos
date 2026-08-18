import Link from "next/link";
import { PageHeader } from "@/components/patterns/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { formatDateTime } from "@/lib/format";

export default async function CovoiturageHomePage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: nextRide }, { data: nextReservation }] = await Promise.all([
    supabase
      .from("carpool_rides")
      .select("id, departure_label, destination_label, departs_at")
      .eq("driver_member_id", session.member.id)
      .eq("status", "scheduled")
      .gte("departs_at", nowIso)
      .order("departs_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("carpool_ride_requests")
      .select("id, status, carpool_rides(departure_label, destination_label, departs_at)")
      .eq("passenger_member_id", session.member.id)
      .in("status", ["pending", "confirmed", "waitlisted"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Covoiturage"
        description="Proposez un trajet ou trouvez une place pour vos prochains rendez-vous à l'église."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prochain trajet (conducteur)</CardTitle>
          </CardHeader>
          <CardContent>
            {nextRide ? (
              <Link href={`/mon-espace/covoiturage/mes-trajets/${nextRide.id}`} className="block text-sm hover:underline">
                {nextRide.departure_label} → {nextRide.destination_label}
                <p className="text-xs text-muted-foreground">{formatDateTime(nextRide.departs_at)}</p>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun trajet proposé à venir.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ma prochaine réservation (passager)</CardTitle>
          </CardHeader>
          <CardContent>
            {nextReservation?.carpool_rides ? (
              <div className="text-sm">
                {nextReservation.carpool_rides.departure_label} → {nextReservation.carpool_rides.destination_label}
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(nextReservation.carpool_rides.departs_at)} · {nextReservation.status}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune réservation en cours.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/mon-espace/covoiturage/rechercher" className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
          Rechercher un trajet
        </Link>
        <Link href="/mon-espace/covoiturage/proposer" className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
          Proposer un trajet
        </Link>
        <Link href="/mon-espace/covoiturage/besoin-d-un-trajet" className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
          Je cherche un trajet
        </Link>
      </div>
    </div>
  );
}
