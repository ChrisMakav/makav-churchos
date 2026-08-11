"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { memberFormSchema } from "@/lib/validation/members";

export interface MemberFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const NO_FAMILY_SENTINEL = "__none__";

function parseMemberForm(formData: FormData) {
  const familyIdRaw = String(formData.get("familyId") ?? "");
  const raw = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    gender: String(formData.get("gender") ?? "") || undefined,
    memberStatus: String(formData.get("memberStatus") ?? "active"),
    joinDate: String(formData.get("joinDate") ?? ""),
    familyId: familyIdRaw === NO_FAMILY_SENTINEL ? "" : familyIdRaw,
    familyRole: String(formData.get("familyRole") ?? "") || undefined,
  };

  const result = memberFormSchema.safeParse(raw);
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

export async function createMember(
  organizationId: string,
  _prevState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  try {
    await requirePermission(organizationId, "members.write");
  } catch {
    return { error: "Vous n'avez pas la permission de créer un membre." };
  }

  const parsed = parseMemberForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      birth_date: parsed.data.birthDate,
      gender: parsed.data.gender ?? null,
      member_status: parsed.data.memberStatus,
      join_date: parsed.data.joinDate,
      family_id: parsed.data.familyId,
      family_role: parsed.data.familyId ? (parsed.data.familyRole ?? "other") : null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Un membre avec cet email existe déjà.", fieldErrors: { email: "Déjà utilisé" } };
    }
    return { error: "Impossible de créer le membre." };
  }

  revalidatePath("/membres");
  redirect(`/membres/${data.id}`);
}

export async function updateMember(
  organizationId: string,
  memberId: string,
  _prevState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  try {
    await requirePermission(organizationId, "members.write");
  } catch {
    return { error: "Vous n'avez pas la permission de modifier ce membre." };
  }

  const parsed = parseMemberForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      birth_date: parsed.data.birthDate,
      gender: parsed.data.gender ?? null,
      member_status: parsed.data.memberStatus,
      join_date: parsed.data.joinDate,
      family_id: parsed.data.familyId,
      family_role: parsed.data.familyId ? (parsed.data.familyRole ?? "other") : null,
    })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Un membre avec cet email existe déjà.", fieldErrors: { email: "Déjà utilisé" } };
    }
    return { error: "Impossible d'enregistrer les modifications." };
  }

  revalidatePath("/membres");
  revalidatePath(`/membres/${memberId}`);
  redirect(`/membres/${memberId}`);
}

export async function setMemberStatus(
  organizationId: string,
  memberId: string,
  status: string,
) {
  await requirePermission(organizationId, "members.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ member_status: status })
    .eq("id", memberId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/membres");
  revalidatePath(`/membres/${memberId}`);
}
