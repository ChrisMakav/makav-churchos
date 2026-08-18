import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { RideSearchForm } from "./ride-search-form";
import { RideResultCard, type RideResult } from "./ride-result-card";

export default async function RechercherTrajetPage({
  searchParams,
}: {
  searchParams: Promise<{
    event?: string;
    date?: string;
    departure?: string;
    destination?: string;
    seats?: string;
    pmr?: string;
  }>;
}) {
  const session = await getMemberSession();
  if (!session) return null;
  const params = await searchParams;

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("organization_id", session.member.organizationId)
    .eq("status", "scheduled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);

  let query = supabase
    .from("carpool_rides")
    .select(
      "id, departure_label, destination_label, departs_at, seats_available, seat_capacity, accepts_children, accepts_luggage, accepts_pets, non_smoking, has_air_conditioning, is_pmr_accessible, members(id, first_name, last_name), events(title), carpool_vehicles(brand, model), carpool_ride_stops(id, label)",
    )
    .eq("organization_id", session.member.organizationId)
    .eq("status", "scheduled")
    .gt("seats_available", 0)
    .gte("departs_at", new Date().toISOString())
    .order("departs_at", { ascending: true })
    .limit(50);

  if (params.event && params.event !== "__none__") query = query.eq("event_id", params.event);
  if (params.date) {
    const start = new Date(`${params.date}T00:00:00Z`).toISOString();
    const end = new Date(`${params.date}T23:59:59Z`).toISOString();
    query = query.gte("departs_at", start).lte("departs_at", end);
  }
  if (params.departure) query = query.ilike("departure_label", `%${params.departure}%`);
  if (params.destination) query = query.ilike("destination_label", `%${params.destination}%`);
  if (params.seats) query = query.gte("seats_available", Number(params.seats));
  if (params.pmr === "1") query = query.eq("is_pmr_accessible", true);

  const { data: rides } = await query;

  const results: RideResult[] = (rides ?? [])
    .filter((r) => r.members?.id !== session.member.id)
    .map((r) => ({
      id: r.id,
      driverName: r.members ? `${r.members.first_name} ${r.members.last_name}` : "—",
      departureLabel: r.departure_label,
      destinationLabel: r.destination_label,
      departsAt: r.departs_at,
      seatsAvailable: r.seats_available,
      seatCapacity: r.seat_capacity,
      eventTitle: r.events?.title ?? null,
      vehicleLabel: r.carpool_vehicles ? `${r.carpool_vehicles.brand} ${r.carpool_vehicles.model}` : null,
      stops: (r.carpool_ride_stops ?? []).map((s) => s.label),
      acceptsChildren: r.accepts_children,
      acceptsLuggage: r.accepts_luggage,
      acceptsPets: r.accepts_pets,
      nonSmoking: r.non_smoking,
      hasAirConditioning: r.has_air_conditioning,
      isPmrAccessible: r.is_pmr_accessible,
    }));

  return (
    <div className="space-y-6">
      <PageHeader title="Rechercher un trajet" />
      <RideSearchForm events={(events ?? []).map((e) => ({ id: e.id, title: e.title }))} />

      {results.length === 0 ? (
        <EmptyState
          title="Aucun trajet disponible actuellement"
          description="Nous vous notifierons dès qu'un trajet compatible sera créé. Essayez aussi 'Je cherche un trajet'."
        />
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <RideResultCard key={r.id} ride={r} />
          ))}
        </div>
      )}
    </div>
  );
}
