import Link from "next/link";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { formatDateTime } from "@/lib/format";
import { CARPOOL_REQUEST_STATUSES } from "@/lib/validation/covoiturage";
import { CancelRequestButton } from "./cancel-request-button";

export default async function MesReservationsPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("carpool_ride_requests")
    .select(
      "id, seats_requested, status, requested_at, carpool_rides(id, departure_label, destination_label, departs_at, members(first_name, last_name))",
    )
    .eq("passenger_member_id", session.member.id)
    .order("requested_at", { ascending: false });

  const rows = requests ?? [];
  const active = rows.filter((r) => ["pending", "confirmed", "waitlisted"].includes(r.status));
  const history = rows.filter((r) => !active.includes(r));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes réservations"
        description="Vos demandes et places réservées sur des trajets d'autres membres."
      />

      <div className="space-y-2">
        <h2 className="font-heading text-lg text-foreground">En cours</h2>
        {active.length === 0 ? (
          <EmptyState title="Aucune réservation en cours" />
        ) : (
          <div className="space-y-2">
            {active.map((r) =>
              r.carpool_rides ? (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <Link
                      href={`/mon-espace/covoiturage/rechercher`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {r.carpool_rides.departure_label} → {r.carpool_rides.destination_label}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(r.carpool_rides.departs_at)} ·{" "}
                      {r.carpool_rides.members
                        ? `${r.carpool_rides.members.first_name} ${r.carpool_rides.members.last_name}`
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {CARPOOL_REQUEST_STATUSES.find((s) => s.value === r.status)?.label ?? r.status}
                    </Badge>
                    <CancelRequestButton requestId={r.id} />
                  </div>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-heading text-lg text-foreground">Historique</h2>
          <div className="space-y-2">
            {history.map((r) =>
              r.carpool_rides ? (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {r.carpool_rides.departure_label} → {r.carpool_rides.destination_label}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.carpool_rides.departs_at)}</p>
                  </div>
                  <Badge variant="secondary">
                    {CARPOOL_REQUEST_STATUSES.find((s) => s.value === r.status)?.label ?? r.status}
                  </Badge>
                </div>
              ) : null,
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
