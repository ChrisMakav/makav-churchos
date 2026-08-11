"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { budgetFormSchema, budgetLineFormSchema } from "@/lib/validation/budgets";

export interface BudgetFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createBudget(
  organizationId: string,
  _prevState: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  try {
    await requirePermission(organizationId, "budgets.write");
  } catch {
    return { error: "Vous n'avez pas la permission de créer un budget." };
  }

  const result = budgetFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    fiscalYear: String(formData.get("fiscalYear") ?? ""),
  });

  if (!result.success) {
    return { error: "Corrigez les champs indiqués." };
  }

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      name: result.data.name,
      fiscal_year: Number(result.data.fiscalYear),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Un budget existe déjà pour cette année." };
    }
    return { error: "Impossible de créer le budget." };
  }

  revalidatePath("/budgets");
  redirect(`/budgets/${data.id}`);
}

export async function setBudgetStatus(organizationId: string, budgetId: string, status: string) {
  await requirePermission(organizationId, "budgets.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .update({ status })
    .eq("id", budgetId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/budgets/${budgetId}`);
  revalidatePath("/budgets");
}

export async function addBudgetLine(
  organizationId: string,
  budgetId: string,
  categoryId: string,
  departmentId: string | null,
  allocatedAmount: string,
) {
  await requirePermission(organizationId, "budgets.write");

  const result = budgetLineFormSchema.safeParse({
    categoryId,
    departmentId: departmentId ?? "",
    allocatedAmount,
  });
  if (!result.success) throw new Error("Ligne budgétaire invalide");

  const supabase = await createClient();
  const { error } = await supabase.from("budget_lines").insert({
    budget_id: budgetId,
    category_id: result.data.categoryId,
    department_id: result.data.departmentId,
    allocated_amount: Number(result.data.allocatedAmount),
  });
  if (error) throw error;
  revalidatePath(`/budgets/${budgetId}`);
}

export async function removeBudgetLine(organizationId: string, budgetId: string, lineId: string) {
  await requirePermission(organizationId, "budgets.write");
  const supabase = await createClient();
  const { error } = await supabase.from("budget_lines").delete().eq("id", lineId);
  if (error) throw error;
  revalidatePath(`/budgets/${budgetId}`);
}
