"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { checkinFormSchema, NEW_CHILD_SENTINEL, NO_EVENT_SENTINEL } from "@/lib/validation/checkin";

export interface CheckinFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseCheckinForm(formData: FormData) {
  const rawEventId = String(formData.get("eventId") ?? "");
  const result = checkinFormSchema.safeParse({
    childMemberId: String(formData.get("childMemberId") ?? ""),
    newChildFirstName: String(formData.get("newChildFirstName") ?? ""),
    newChildLastName: String(formData.get("newChildLastName") ?? ""),
    newChildBirthDate: String(formData.get("newChildBirthDate") ?? ""),
    eventId: rawEventId === NO_EVENT_SENTINEL ? "" : rawEventId,
    guardianName: String(formData.get("guardianName") ?? ""),
    guardianPhone: String(formData.get("guardianPhone") ?? ""),
    notes: String(formData.get("notes") ?? ""),
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

function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function createCheckin(
  organizationId: string,
  _prevState: CheckinFormState,
  formData: FormData,
): Promise<CheckinFormState> {
  try {
    await requirePermission(organizationId, "checkin.write");
  } catch {
    return { error: "Vous n'avez pas la permission d'enregistrer un check-in." };
  }

  const parsed = parseCheckinForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const siteId = await getDefaultSiteId(organizationId);

  let childMemberId = parsed.data.childMemberId;

  if (childMemberId === NEW_CHILD_SENTINEL) {
    const { data: newChild, error: childError } = await supabase
      .from("members")
      .insert({
        organization_id: organizationId,
        site_id: siteId,
        first_name: parsed.data.newChildFirstName!,
        last_name: parsed.data.newChildLastName!,
        birth_date: parsed.data.newChildBirthDate,
        family_role: "child",
        member_status: "visitor",
      })
      .select("id")
      .single();

    if (childError || !newChild) return { error: "Impossible de créer la fiche de l'enfant." };
    childMemberId = newChild.id;
  }

  // Le code de sécurité n'a besoin d'être unique que parmi les sessions
  // actives (voir le commentaire d'en-tête de 0012_checkin.sql) : on tente
  // quelques codes aléatoires plutôt qu'un compteur atomique dédié.
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await supabase
      .from("checkin_sessions")
      .insert({
        organization_id: organizationId,
        site_id: siteId,
        event_id: parsed.data.eventId,
        child_member_id: childMemberId,
        guardian_name: parsed.data.guardianName,
        guardian_phone: parsed.data.guardianPhone,
        security_code: randomCode(),
        notes: parsed.data.notes,
        checked_in_by: user.id,
      })
      .select("id")
      .single();

    if (!error && data) {
      revalidatePath("/checkin");
      redirect(`/checkin/${data.id}/etiquette`);
    }

    if (error && error.code !== "23505") {
      return { error: "Impossible d'enregistrer le check-in." };
    }
    // 23505 (code déjà pris par une session active) : on retente avec un nouveau code.
  }

  return { error: "Impossible de générer un code disponible, réessayez." };
}

export async function checkOutChild(organizationId: string, sessionId: string) {
  await requirePermission(organizationId, "checkin.write");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée");

  const { error } = await supabase
    .from("checkin_sessions")
    .update({ checked_out_at: new Date().toISOString(), checked_out_by: user.id })
    .eq("id", sessionId)
    .eq("organization_id", organizationId);

  if (error) throw error;
  revalidatePath("/checkin");
}
