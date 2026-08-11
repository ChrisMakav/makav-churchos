"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { familyFormSchema } from "@/lib/validation/members";

export interface FamilyFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createFamily(
  organizationId: string,
  _prevState: FamilyFormState,
  formData: FormData,
): Promise<FamilyFormState> {
  try {
    await requirePermission(organizationId, "families.write");
  } catch {
    return { error: "Vous n'avez pas la permission de créer une famille." };
  }

  const result = familyFormSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!result.success) {
    return { error: "Le nom de la famille est requis.", fieldErrors: { name: "Requis" } };
  }

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("families")
    .insert({ organization_id: organizationId, site_id: siteId, name: result.data.name })
    .select("id")
    .single();

  if (error) return { error: "Impossible de créer la famille." };

  revalidatePath("/familles");
  redirect(`/familles/${data.id}`);
}

export async function renameFamily(organizationId: string, familyId: string, name: string) {
  await requirePermission(organizationId, "families.write");
  if (!name.trim()) throw new Error("Le nom est requis");

  const supabase = await createClient();
  const { error } = await supabase
    .from("families")
    .update({ name: name.trim() })
    .eq("id", familyId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/familles/${familyId}`);
  revalidatePath("/familles");
}

export async function addMemberToFamily(
  organizationId: string,
  familyId: string,
  memberId: string,
  familyRole: string,
) {
  await requirePermission(organizationId, "members.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ family_id: familyId, family_role: familyRole })
    .eq("id", memberId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/familles/${familyId}`);
  revalidatePath("/membres");
}

export async function removeMemberFromFamily(
  organizationId: string,
  familyId: string,
  memberId: string,
) {
  await requirePermission(organizationId, "members.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ family_id: null, family_role: null })
    .eq("id", memberId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/familles/${familyId}`);
  revalidatePath("/membres");
}

export async function setFamilyHead(
  organizationId: string,
  familyId: string,
  headMemberId: string | null,
) {
  await requirePermission(organizationId, "families.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("families")
    .update({ head_member_id: headMemberId })
    .eq("id", familyId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/familles/${familyId}`);
}
