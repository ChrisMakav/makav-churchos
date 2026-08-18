"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { pastoralRecordFormSchema } from "@/lib/validation/pastoral-care";

export interface PastoralRecordFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parsePastoralRecordForm(formData: FormData) {
  const result = pastoralRecordFormSchema.safeParse({
    memberId: String(formData.get("memberId") ?? ""),
    category: String(formData.get("category") ?? "visit"),
    notes: String(formData.get("notes") ?? ""),
    followUpDate: String(formData.get("followUpDate") ?? ""),
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

export async function createPastoralRecord(
  organizationId: string,
  _prevState: PastoralRecordFormState,
  formData: FormData,
): Promise<PastoralRecordFormState> {
  try {
    await requirePermission(organizationId, "pastoral_care.write");
  } catch {
    return { error: "Vous n'avez pas la permission d'ajouter un suivi pastoral." };
  }

  const parsed = parsePastoralRecordForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const siteId = await getDefaultSiteId(organizationId);
  const { data, error } = await supabase
    .from("pastoral_records")
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      member_id: parsed.data.memberId,
      category: parsed.data.category,
      notes: parsed.data.notes,
      follow_up_date: parsed.data.followUpDate,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: "Impossible d'enregistrer le suivi." };

  revalidatePath("/suivi-pastoral");
  redirect(`/suivi-pastoral/${data.id}`);
}

export async function updatePastoralRecord(
  organizationId: string,
  recordId: string,
  _prevState: PastoralRecordFormState,
  formData: FormData,
): Promise<PastoralRecordFormState> {
  try {
    await requirePermission(organizationId, "pastoral_care.write");
  } catch {
    return { error: "Vous n'avez pas la permission de modifier ce suivi." };
  }

  const parsed = parsePastoralRecordForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pastoral_records")
    .update({
      member_id: parsed.data.memberId,
      category: parsed.data.category,
      notes: parsed.data.notes,
      follow_up_date: parsed.data.followUpDate,
    })
    .eq("id", recordId)
    .eq("organization_id", organizationId);

  if (error) return { error: "Impossible d'enregistrer les modifications." };

  revalidatePath("/suivi-pastoral");
  revalidatePath(`/suivi-pastoral/${recordId}`);
  redirect(`/suivi-pastoral/${recordId}`);
}

export async function setPastoralRecordStatus(
  organizationId: string,
  recordId: string,
  status: string,
) {
  await requirePermission(organizationId, "pastoral_care.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("pastoral_records")
    .update({ status })
    .eq("id", recordId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/suivi-pastoral/${recordId}`);
  revalidatePath("/suivi-pastoral");
}
