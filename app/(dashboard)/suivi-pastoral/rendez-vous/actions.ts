"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { appointmentSlotFormSchema } from "@/lib/validation/pastoral-appointments";

export interface AppointmentSlotFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createAppointmentSlot(
  organizationId: string,
  _prevState: AppointmentSlotFormState,
  formData: FormData,
): Promise<AppointmentSlotFormState> {
  try {
    await requirePermission(organizationId, "pastoral_appointments.write");
  } catch {
    return { error: "Vous n'avez pas la permission de créer un créneau." };
  }

  const result = appointmentSlotFormSchema.safeParse({
    pastorUserId: String(formData.get("pastorUserId") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    location: String(formData.get("location") ?? ""),
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Corrigez les champs indiqués.", fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const siteId = await getDefaultSiteId(organizationId);
  const { error } = await supabase.from("pastoral_appointment_slots").insert({
    organization_id: organizationId,
    site_id: siteId,
    pastor_user_id: result.data.pastorUserId,
    starts_at: result.data.startsAt,
    ends_at: result.data.endsAt,
    location: result.data.location,
    created_by: user.id,
  });

  if (error) return { error: "Impossible de créer le créneau." };

  revalidatePath("/suivi-pastoral/rendez-vous");
  redirect("/suivi-pastoral/rendez-vous");
}

export async function confirmAppointmentSlot(organizationId: string, slotId: string) {
  await requirePermission(organizationId, "pastoral_appointments.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pastoral_appointment_slots")
    .update({ status: "confirmed" })
    .eq("id", slotId)
    .eq("organization_id", organizationId)
    .eq("status", "requested");
  if (error) throw error;
  revalidatePath("/suivi-pastoral/rendez-vous");
}

export async function completeAppointmentSlot(organizationId: string, slotId: string) {
  await requirePermission(organizationId, "pastoral_appointments.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pastoral_appointment_slots")
    .update({ status: "completed" })
    .eq("id", slotId)
    .eq("organization_id", organizationId)
    .eq("status", "confirmed");
  if (error) throw error;
  revalidatePath("/suivi-pastoral/rendez-vous");
}

// Refuse une demande ou annule un rendez-vous confirmé : le créneau redevient
// disponible plutôt que d'être marqué "annulé" — voir le commentaire d'en-tête
// de la migration (même pattern que volunteer_slots, pas d'historique des
// désistements).
export async function releaseAppointmentSlot(organizationId: string, slotId: string) {
  await requirePermission(organizationId, "pastoral_appointments.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pastoral_appointment_slots")
    .update({ status: "open", member_id: null, reason: null })
    .eq("id", slotId)
    .eq("organization_id", organizationId)
    .in("status", ["requested", "confirmed"]);
  if (error) throw error;
  revalidatePath("/suivi-pastoral/rendez-vous");
}

export async function deleteAppointmentSlot(organizationId: string, slotId: string) {
  await requirePermission(organizationId, "pastoral_appointments.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pastoral_appointment_slots")
    .delete()
    .eq("id", slotId)
    .eq("organization_id", organizationId)
    .eq("status", "open");
  if (error) throw error;
  revalidatePath("/suivi-pastoral/rendez-vous");
}

// --- Pasteurs & responsables -------------------------------------------------
// Décider qui peut gérer l'agenda pastoral reste une décision d'administration
// d'organisation : organization.manage, pas pastoral_appointments.write (un
// pasteur ne peut pas s'accorder un accès aux créneaux d'un autre pasteur).

export async function addAppointmentManager(organizationId: string, userId: string) {
  await requirePermission(organizationId, "organization.manage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée");

  const { error } = await supabase.from("pastoral_appointment_managers").insert({
    organization_id: organizationId,
    user_id: userId,
    created_by: user.id,
  });
  if (error && error.code !== "23505") throw error;
  revalidatePath("/suivi-pastoral/rendez-vous/gestion");
}

export async function removeAppointmentManager(organizationId: string, userId: string) {
  await requirePermission(organizationId, "organization.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pastoral_appointment_managers")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error) throw error;
  revalidatePath("/suivi-pastoral/rendez-vous/gestion");
}
