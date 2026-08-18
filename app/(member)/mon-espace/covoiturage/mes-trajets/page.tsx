import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { formatDateTime } from "@/lib/format";

export default async function MesTrajetsPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: rides } = await supabase
    .from("carpool_rides")
    .select("id, departure_label, destination_label, departs_at, status, seat_capacity, seats_available")
    .eq("driver_member_id", session.member.id)
    .order("departs_at", { ascending: false });

  const rows = rides ?? [];
  const nowIso = new Date().toISOString();
  const upcoming = rows.filter((r) => r.departs_at >= nowIso && r.status !== "cancelled" && r.status !== "completed");
  const history = rows.filter((r) => !upcoming.includes(r));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes trajets"
        actions={
          <Button render={<Link href="/mon-espace/covoiturage/proposer" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Proposer un trajet
          </Button>
        }
      />

      <div className="space-y-2">
        <h2 className="font-heading text-lg text-foreground">À venir</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="Aucun trajet à venir" />
        ) : (
          <div className="space-y-2">
            {upcoming.map((r) => (
              <Link
                key={r.id}
                href={`/mon-espace/covoiturage/mes-trajets/${r.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {r.departure_label} → {r.destination_label}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(r.departs_at)}</p>
                </div>
                <Badge variant="outline">
                  {r.seat_capacity - r.seats_available}/{r.seat_capacity} places
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-heading text-lg text-foreground">Historique</h2>
          <div className="space-y-2">
            {history.map((r) => (
              <Link
                key={r.id}
                href={`/mon-espace/covoiturage/mes-trajets/${r.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {r.departure_label} → {r.destination_label}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(r.departs_at)}</p>
                </div>
                <Badge variant="secondary">{r.status}</Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
