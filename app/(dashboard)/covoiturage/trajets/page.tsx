import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { RidesList, type RideRow } from "./rides-list";

export default async function CovoiturageTrajetsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { event: eventId } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("carpool_rides")
    .select(
      "id, departure_label, destination_label, departs_at, status, seat_capacity, seats_available, members(first_name, last_name), events(title)",
    )
    .eq("organization_id", session.activeOrg.organizationId)
    .order("departs_at", { ascending: false });

  if (eventId) query = query.eq("event_id", eventId);

  const { data: rides } = await query;

  const rows: RideRow[] = (rides ?? []).map((r) => ({
    id: r.id,
    departureLabel: r.departure_label,
    destinationLabel: r.destination_label,
    departsAt: r.departs_at,
    status: r.status,
    seatCapacity: r.seat_capacity,
    seatsAvailable: r.seats_available,
    driverName: r.members ? `${r.members.first_name} ${r.members.last_name}` : "—",
    eventTitle: r.events?.title ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trajets"
        description={`${rows.length} trajet${rows.length > 1 ? "s" : ""}${eventId ? " pour cet événement" : ""}.`}
      />
      <RidesList rows={rows} />
    </div>
  );
}
