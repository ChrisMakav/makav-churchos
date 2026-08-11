"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { departmentFormSchema } from "@/lib/validation/departments";

export interface DepartmentFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseDepartmentForm(formData: FormData) {
  const result = departmentFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (!result.success) {
    return { error: "Le nom du département est requis.", fieldErrors: { name: "Requis" }, data: null } as const;
  }
  return { error: undefined, fieldErrors: undefined, data: result.data } as const;
}

export async function createDepartment(
  organizationId: string,
  _prevState: DepartmentFormState,
  formData: FormData,
): Promise<DepartmentFormState> {
  try {
    await requirePermission(organizationId, "departments.write");
  } catch {
    return { error: "Vous n'avez pas la permission de créer un département." };
  }

  const parsed = parseDepartmentForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      name: parsed.data.name,
      description: parsed.data.description,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Un département avec ce nom existe déjà.", fieldErrors: { name: "Déjà utilisé" } };
    }
    return { error: "Impossible de créer le département." };
  }

  revalidatePath("/departements");
  redirect(`/departements/${data.id}`);
}

export async function updateDepartment(
  organizationId: string,
  departmentId: string,
  _prevState: DepartmentFormState,
  formData: FormData,
): Promise<DepartmentFormState> {
  try {
    await requirePermission(organizationId, "departments.write");
  } catch {
    return { error: "Vous n'avez pas la permission de modifier ce département." };
  }

  const parsed = parseDepartmentForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .update({ name: parsed.data.name, description: parsed.data.description })
    .eq("id", departmentId)
    .eq("organization_id", organizationId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Un département avec ce nom existe déjà.", fieldErrors: { name: "Déjà utilisé" } };
    }
    return { error: "Impossible d'enregistrer les modifications." };
  }

  revalidatePath("/departements");
  revalidatePath(`/departements/${departmentId}`);
  redirect(`/departements/${departmentId}`);
}

export async function addDepartmentMember(
  organizationId: string,
  departmentId: string,
  memberId: string,
  roleInDepartment: string,
) {
  await requirePermission(organizationId, "departments.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("department_members")
    .upsert(
      { department_id: departmentId, member_id: memberId, role_in_department: roleInDepartment },
      { onConflict: "department_id,member_id" },
    );
  if (error) throw error;
  revalidatePath(`/departements/${departmentId}`);
}

export async function removeDepartmentMember(
  organizationId: string,
  departmentId: string,
  memberId: string,
) {
  await requirePermission(organizationId, "departments.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("department_members")
    .delete()
    .eq("department_id", departmentId)
    .eq("member_id", memberId);
  if (error) throw error;
  revalidatePath(`/departements/${departmentId}`);
}

export async function setDepartmentLeader(
  organizationId: string,
  departmentId: string,
  leaderMemberId: string | null,
) {
  await requirePermission(organizationId, "departments.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .update({ leader_member_id: leaderMemberId })
    .eq("id", departmentId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/departements/${departmentId}`);
}
