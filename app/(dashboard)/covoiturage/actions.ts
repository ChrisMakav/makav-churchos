"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";

export async function cancelRideStaff(organizationId: string, rideId: string) {
  await requirePermission(organizationId, "carpooling.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("carpool_rides")
    .update({ status: "cancelled" })
    .eq("id", rideId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/covoiturage/trajets");
  revalidatePath(`/covoiturage/trajets/${rideId}`);
}

export async function resolveIncident(organizationId: string, incidentId: string) {
  await requirePermission(organizationId, "carpooling.manage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("carpool_incidents")
    .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: user?.id })
    .eq("id", incidentId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/covoiturage/incidents");
}

export async function reopenIncident(organizationId: string, incidentId: string) {
  await requirePermission(organizationId, "carpooling.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("carpool_incidents")
    .update({ status: "open", resolved_at: null, resolved_by: null })
    .eq("id", incidentId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/covoiturage/incidents");
}

export async function markRideNeedMatched(organizationId: string, needId: string) {
  await requirePermission(organizationId, "carpooling.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("carpool_ride_needs")
    .update({ status: "matched" })
    .eq("id", needId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/covoiturage/besoins");
}
