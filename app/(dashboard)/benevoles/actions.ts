"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { assignVolunteerSchema } from "@/lib/validation/volunteers";

export async function createVacantSlot(
  organizationId: string,
  departmentId: string,
  serviceDate: string,
) {
  await requirePermission(organizationId, "volunteers.write");
  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const { error } = await supabase.from("volunteer_slots").insert({
    organization_id: organizationId,
    site_id: siteId,
    department_id: departmentId,
    service_date: serviceDate,
    status: "vacant",
  });
  if (error) throw error;
  revalidatePath("/benevoles");
}

export async function addAssignedSlot(
  organizationId: string,
  departmentId: string,
  serviceDate: string,
  memberId: string,
) {
  await requirePermission(organizationId, "volunteers.write");
  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const { error } = await supabase.from("volunteer_slots").insert({
    organization_id: organizationId,
    site_id: siteId,
    department_id: departmentId,
    service_date: serviceDate,
    member_id: memberId,
    status: "pending",
  });
  if (error) throw error;
  revalidatePath("/benevoles");
}

export async function assignVolunteer(organizationId: string, slotId: string, memberId: string) {
  await requirePermission(organizationId, "volunteers.write");
  const parsed = assignVolunteerSchema.safeParse({ slotId, memberId });
  if (!parsed.success) throw new Error("Affectation invalide.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteer_slots")
    .update({ member_id: parsed.data.memberId, status: "pending" })
    .eq("id", parsed.data.slotId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/benevoles");
}

export async function confirmSlot(organizationId: string, slotId: string) {
  await requirePermission(organizationId, "volunteers.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteer_slots")
    .update({ status: "confirmed" })
    .eq("id", slotId)
    .eq("organization_id", organizationId)
    .not("member_id", "is", null);
  if (error) throw error;
  revalidatePath("/benevoles");
}

export async function unassignVolunteer(organizationId: string, slotId: string) {
  await requirePermission(organizationId, "volunteers.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteer_slots")
    .update({ member_id: null, status: "vacant" })
    .eq("id", slotId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/benevoles");
}

export async function deleteVacantSlot(organizationId: string, slotId: string) {
  await requirePermission(organizationId, "volunteers.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteer_slots")
    .delete()
    .eq("id", slotId)
    .eq("organization_id", organizationId)
    .eq("status", "vacant");
  if (error) throw error;
  revalidatePath("/benevoles");
}

// Notifie les bénévoles dont l'affectation est encore "pending" (in-app
// uniquement — pas de canal e-mail/SMS en P1, voir notifications existantes).
// Seuls les membres avec un compte lié (user_id non nul, portail membre) sont
// notifiables ; les autres sont silencieusement ignorés plutôt que de bloquer
// la relance groupée.
export async function relancerNonConfirmes(organizationId: string): Promise<number> {
  await requirePermission(organizationId, "volunteers.write");
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const { data: pending, error } = await supabase
    .from("volunteer_slots")
    .select("service_date, departments(name), members(user_id)")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .gte("service_date", today);
  if (error) throw error;

  const rows = (pending ?? []).filter(
    (slot): slot is typeof slot & { members: { user_id: string | null } } => Boolean(slot.members),
  );

  const notifications = rows
    .filter((slot) => slot.members.user_id)
    .map((slot) => ({
      organization_id: organizationId,
      user_id: slot.members.user_id as string,
      type: "volunteer_reminder",
      title: "Confirmation de service attendue",
      body: `Merci de confirmer votre disponibilité pour ${slot.departments?.name ?? "un service"} le ${new Date(slot.service_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", timeZone: "UTC" })}.`,
      link: "/mon-espace/notifications",
    }));

  if (notifications.length === 0) return 0;

  const { error: insertError } = await supabase.from("notifications").insert(notifications);
  if (insertError) throw insertError;

  return notifications.length;
}
