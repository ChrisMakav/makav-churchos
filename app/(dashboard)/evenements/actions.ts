"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { eventFormSchema } from "@/lib/validation/events";

export interface EventFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const NO_DEPARTMENT_SENTINEL = "__none__";

function parseEventForm(formData: FormData) {
  const departmentIdRaw = String(formData.get("departmentId") ?? "");
  const result = eventFormSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    eventTypeId: String(formData.get("eventTypeId") ?? ""),
    description: String(formData.get("description") ?? ""),
    location: String(formData.get("location") ?? ""),
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
