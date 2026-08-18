import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { IncidentForm } from "./incident-form";

export default async function SignalerIncidentPage({
  searchParams,
}: {
  searchParams: Promise<{ ride?: string }>;
}) {
  const session = await getMemberSession();
  if (!session) return null;
  const { ride: preselectedRideId } = await searchParams;

  const supabase = await createClient();
  const [{ data: asDriver }, { data: asPassenger }] = await Promise.all([
    supabase
      .from("carpool_rides")
      .select("id, departure_label, destination_label, departs_at")
      .eq("driver_member_id", session.member.id),
    supabase
      .from("carpool_ride_requests")
      .select("carpool_rides(id, departure_label, destination_label, departs_at)")
      .eq("passenger_member_id", session.member.id)
      .in("status", ["confirmed", "pending"]),
  ]);

  const rideMap = new Map<string, { id: string; label: string }>();
  for (const r of asDriver ?? []) {
    rideMap.set(r.id, { id: r.id, label: `${r.departure_label} → ${r.destination_label}` });
  }
  for (const req of asPassenger ?? []) {
    if (req.carpool_rides) {
      rideMap.set(req.carpool_rides.id, {
        id: req.carpool_rides.id,
        label: `${req.carpool_rides.departure_label} → ${req.carpool_rides.destination_label}`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Signaler un incident" />
      <IncidentForm rides={Array.from(rideMap.values())} preselectedRideId={preselectedRideId} />
    </div>
  );
}
