"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import {
  eventFormSchema,
  registrationCountSchema,
  registrationTrackFormSchema,
  roomFormSchema,
  serviceItemFormSchema,
} from "@/lib/validation/events";

export interface EventFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const NO_DEPARTMENT_SENTINEL = "__none__";
const NO_ROOM_SENTINEL = "__none__";

function parseEventForm(formData: FormData) {
  const departmentIdRaw = String(formData.get("departmentId") ?? "");
  const roomIdRaw = String(formData.get("roomId") ?? "");
  const result = eventFormSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    eventTypeId: String(formData.get("eventTypeId") ?? ""),
    description: String(formData.get("description") ?? ""),
    location: String(formData.get("location") ?? ""),
    roomId: roomIdRaw === NO_ROOM_SENTINEL ? "" : roomIdRaw,
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    departmentId: departmentIdRaw === NO_DEPARTMENT_SENTINEL ? "" : departmentIdRaw,
    capacity: String(formData.get("capacity") ?? ""),
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Corrigez les champs indiqués.", fieldErrors, data: null } as const;
  }

  return { error: undefined, fieldErrors: undefined, data: result.data } as const;
}

export async function createEvent(
  organizationId: string,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  try {
    await requirePermission(organizationId, "events.write");
  } catch {
    return { error: "Vous n'avez pas la permission de créer un événement." };
  }

  const parsed = parseEventForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("events")
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      event_type_id: parsed.data.eventTypeId,
      department_id: parsed.data.departmentId,
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      room_id: parsed.data.roomId,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      capacity: parsed.data.capacity,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createEvent", error);
    return { error: "Impossible de créer l'événement." };
  }

  revalidatePath("/evenements");
  redirect(`/evenements/${data.id}`);
}

export async function updateEvent(
  organizationId: string,
  eventId: string,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  try {
    await requirePermission(organizationId, "events.write");
  } catch {
    return { error: "Vous n'avez pas la permission de modifier cet événement." };
  }

  const parsed = parseEventForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      event_type_id: parsed.data.eventTypeId,
      department_id: parsed.data.departmentId,
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      room_id: parsed.data.roomId,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      capacity: parsed.data.capacity,
    })
    .eq("id", eventId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("updateEvent", error);
    return { error: "Impossible d'enregistrer les modifications." };
  }

  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
  redirect(`/evenements/${eventId}`);
}

export async function setEventStatus(organizationId: string, eventId: string, status: string) {
  await requirePermission(organizationId, "events.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
}

// --- Salles ---------------------------------------------------------------

export async function createRoom(
  organizationId: string,
  name: string,
  capacity: string,
) {
  await requirePermission(organizationId, "events.write");
  const parsed = roomFormSchema.safeParse({ name, capacity });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Salle invalide.");

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").insert({
    organization_id: organizationId,
    site_id: siteId,
    name: parsed.data.name,
    capacity: parsed.data.capacity,
  });
  if (error) throw error;
  revalidatePath("/evenements");
  revalidatePath("/evenements/salles");
}

export async function updateRoom(
  organizationId: string,
  roomId: string,
  name: string,
  capacity: string,
) {
  await requirePermission(organizationId, "events.write");
  const parsed = roomFormSchema.safeParse({ name, capacity });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Salle invalide.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    .update({ name: parsed.data.name, capacity: parsed.data.capacity })
    .eq("id", roomId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/evenements");
  revalidatePath("/evenements/salles");
}

export async function deleteRoom(organizationId: string, roomId: string) {
  await requirePermission(organizationId, "events.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", roomId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/evenements");
  revalidatePath("/evenements/salles");
}

// --- Déroulé du culte -------------------------------------------------------

export async function createServiceItem(
  organizationId: string,
  eventId: string,
  startsAt: string,
  title: string,
  ownerName: string,
) {
  await requirePermission(organizationId, "events.write");
  const parsed = serviceItemFormSchema.safeParse({ startsAt, title, ownerName });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Élément invalide.");

  const supabase = await createClient();
  const { error } = await supabase.from("event_service_items").insert({
    event_id: eventId,
    starts_at: parsed.data.startsAt,
    title: parsed.data.title,
    owner_name: parsed.data.ownerName,
  });
  if (error) throw error;
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
}

export async function deleteServiceItem(organizationId: string, eventId: string, itemId: string) {
  await requirePermission(organizationId, "events.write");
  const supabase = await createClient();
  const { error } = await supabase.from("event_service_items").delete().eq("id", itemId);
  if (error) throw error;
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
}

// --- Inscriptions ouvertes ---------------------------------------------------

export async function createRegistrationTrack(
  organizationId: string,
  eventId: string,
  label: string,
  capacity: string,
  registeredCount: string,
) {
  await requirePermission(organizationId, "events.write");
  const parsed = registrationTrackFormSchema.safeParse({ label, capacity, registeredCount });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Suivi invalide.");

  const supabase = await createClient();
  const { error } = await supabase.from("event_registration_tracks").insert({
    event_id: eventId,
    label: parsed.data.label,
    capacity: parsed.data.capacity,
    registered_count: parsed.data.registeredCount,
  });
  if (error) throw error;
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
}

export async function updateRegistrationCount(
  organizationId: string,
  eventId: string,
  trackId: string,
  registeredCount: string,
) {
  await requirePermission(organizationId, "events.write");
  const parsed = registrationCountSchema.safeParse(registeredCount);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Valeur invalide.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_registration_tracks")
    .update({ registered_count: parsed.data })
    .eq("id", trackId);
  if (error) throw error;
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
}

export async function deleteRegistrationTrack(
  organizationId: string,
  eventId: string,
  trackId: string,
) {
  await requirePermission(organizationId, "events.write");
  const supabase = await createClient();
  const { error } = await supabase.from("event_registration_tracks").delete().eq("id", trackId);
  if (error) throw error;
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
}
