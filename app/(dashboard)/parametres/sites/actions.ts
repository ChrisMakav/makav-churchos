"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";

export interface SiteFormState {
  error?: string;
}

export async function createSite(
  organizationId: string,
  _prevState: SiteFormState,
  formData: FormData,
): Promise<SiteFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!name) {
    return { error: "Le nom du campus est requis." };
  }

  try {
    await requirePermission(organizationId, "organization.manage");
  } catch {
    return { error: "Vous n'avez pas la permission de créer un site." };
  }

  const supabase = await createClient();

  // Un site de type "campus" doit être rattaché à une église (trigger
  // validate_site_hierarchy, 0001) — on rattache toujours au site racine
  // "church" créé par create_organization, seule hiérarchie gérée en UI pour
  // l'instant (pas de régions/multi-niveaux).
  const { data: rootSite, error: rootError } = await supabase
    .from("sites")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("type", "church")
    .is("parent_site_id", null)
    .limit(1)
    .maybeSingle();

  if (rootError || !rootSite) {
    return { error: "Impossible de trouver le site racine de l'organisation." };
  }

  const { error } = await supabase.from("sites").insert({
    organization_id: organizationId,
    parent_site_id: rootSite.id,
    type: "campus",
    name,
    address: address || null,
    city: city || null,
  });

  if (error) {
    return { error: "Impossible de créer le campus." };
  }

  revalidatePath("/parametres/sites");
  revalidatePath("/", "layout");
  return {};
}

export async function toggleSiteActive(organizationId: string, siteId: string, isActive: boolean) {
  await requirePermission(organizationId, "organization.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("sites")
    .update({ is_active: isActive })
    .eq("id", siteId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/parametres/sites");
  revalidatePath("/", "layout");
}
