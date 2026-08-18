"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { attendanceFormSchema, NO_EVENT_SENTINEL } from "@/lib/validation/attendance";

export interface AttendanceFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createAttendanceRecord(
  organizationId: string,
  _prevState: AttendanceFormState,
  formData: FormData,
): Promise<AttendanceFormState> {
  try {
    await requirePermission(organizationId, "attendance.write");
  } catch {
    return { error: "Vous n'avez pas la permission d'enregistrer une statistique." };
  }

  const rawEventId = String(formData.get("eventId") ?? "");
  const result = attendanceFormSchema.safeParse({
    eventId: rawEventId === NO_EVENT_SENTINEL ? "" : rawEventId,
    serviceDate: String(formData.get("serviceDate") ?? ""),
    label: String(formData.get("label") ?? ""),
    womenCount: String(formData.get("womenCount") ?? "0"),
    menCount: String(formData.get("menCount") ?? "0"),
    teensCount: String(formData.get("teensCount") ?? "0"),
    childrenCount: String(formData.get("childrenCount") ?? "0"),
    newPeopleCount: String(formData.get("newPeopleCount") ?? "0"),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Corrigez les champs indiqués.", fieldErrors };
  }

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const { error } = await supabase.from("attendance_records").insert({
    organization_id: organizationId,
    site_id: siteId,
    event_id: result.data.eventId,
    service_date: result.data.serviceDate,
    label: result.data.label,
    women_count: result.data.womenCount,
    men_count: result.data.menCount,
    teens_count: result.data.teensCount,
    children_count: result.data.childrenCount,
    new_people_count: result.data.newPeopleCount,
    notes: result.data.notes,
    created_by: user.id,
  });

  if (error) {
    console.error("createAttendanceRecord", error);
    return { error: "Impossible d'enregistrer la statistique." };
  }

  revalidatePath("/statistiques");
  redirect("/statistiques");
}
