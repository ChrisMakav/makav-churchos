"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";

export interface OrganisationSettingsState {
  error?: string;
  success?: boolean;
}

export async function updateOrganization(
  organizationId: string,
  _prevState: OrganisationSettingsState,
  formData: FormData,
): Promise<OrganisationSettingsState> {
  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (!name || !currency || !timezone) {
    return { error: "Tous les champs sont requis." };
  }

  try {
    await requirePermission(organizationId, "organization.manage");
  } catch {
    return { error: "Vous n'avez pas la permission de modifier ces paramètres." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name, currency, timezone })
    .eq("id", organizationId);

  if (error) {
    return { error: "Impossible d'enregistrer les modifications." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
