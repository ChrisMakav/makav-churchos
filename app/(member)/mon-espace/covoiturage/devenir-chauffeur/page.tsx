import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { DriverAvailabilityForm } from "./driver-availability-form";

export default async function DevenirChauffeurPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: vehicles }, { data: existing }] = await Promise.all([
    supabase
      .from("carpool_vehicles")
      .select("id, brand, model")
      .eq("member_id", session.member.id),
    supabase
      .from("carpool_driver_availabilities")
      .select("vehicle_id, zones, frequency, notes, is_active")
      .eq("member_id", session.member.id)
      .maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devenir chauffeur bénévole"
        description="Indiquez vos disponibilités pour que le responsable mobilité puisse compter sur vous."
      />
      <DriverAvailabilityForm
        vehicles={(vehicles ?? []).map((v) => ({ id: v.id, label: `${v.brand} ${v.model}` }))}
        initialValues={
          existing
            ? {
                vehicleId: existing.vehicle_id ?? "",
                zones: existing.zones ?? "",
                frequency: existing.frequency ?? "",
                notes: existing.notes ?? "",
                isActive: existing.is_active,
              }
            : undefined
        }
      />
    </div>
  );
}
