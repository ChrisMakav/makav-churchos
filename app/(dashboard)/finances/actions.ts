"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { accountFormSchema, expenseFormSchema, incomeFormSchema } from "@/lib/validation/finance";

export interface FinanceFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const NONE_SENTINEL = "__none__";

export async function createAccount(
  organizationId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  try {
    await requirePermission(organizationId, "finance.accounts.write");
  } catch {
    return { error: "Vous n'avez pas la permission de créer un compte." };
  }

  const result = accountFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "bank"),
    currency: String(formData.get("currency") ?? ""),
    openingBalance: String(formData.get("openingBalance") ?? ""),
  });

  if (!result.success) {
    return { error: "Corrigez les champs indiqués.", fieldErrors: { name: "Requis" } };
  }

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert({
    organization_id: organizationId,
    site_id: siteId,
    name: result.data.name,
    type: result.data.type,
    currency: result.data.currency,
    opening_balance: result.data.openingBalance,
  });

  if (error) return { error: "Impossible de créer le compte." };

  revalidatePath("/finances/comptes");
  redirect("/finances/comptes");
}

export async function createExpense(
  organizationId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  try {
    await requirePermission(organizationId, "finance.expenses.write");
  } catch {
    return { error: "Vous n'avez pas la permission de créer une dépense." };
  }

  const departmentIdRaw = String(formData.get("departmentId") ?? "");
  const budgetLineIdRaw = String(formData.get("budgetLineId") ?? "");
  const result = expenseFormSchema.safeParse({
    vendor: String(formData.get("vendor") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    departmentId: departmentIdRaw === NONE_SENTINEL ? "" : departmentIdRaw,
    budgetLineId: budgetLineIdRaw === NONE_SENTINEL ? "" : budgetLineIdRaw,
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    description: String(formData.get("description") ?? ""),
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

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      department_id: result.data.departmentId,
      category_id: result.data.categoryId,
      budget_line_id: result.data.budgetLineId,
      vendor: result.data.vendor,
      amount: Number(result.data.amount),
      currency: result.data.currency,
      description: result.data.description,
      requested_by: user!.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createExpense", error);
    return { error: "Impossible de créer la dépense." };
  }

  revalidatePath("/finances/depenses");
  redirect(`/finances/depenses/${data.id}`);
}

export async function approveExpense(organizationId: string, expenseId: string, approve: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_expense", {
    target_expense_id: expenseId,
    approve,
  });
  if (error) throw error;
  revalidatePath("/finances/depenses");
  revalidatePath(`/finances/depenses/${expenseId}`);
}

export async function markExpensePaid(
  organizationId: string,
  expenseId: string,
  accountId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_expense_paid", {
    target_expense_id: expenseId,
    target_account_id: accountId,
    occurred_on: new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
  revalidatePath("/finances/depenses");
  revalidatePath(`/finances/depenses/${expenseId}`);
  revalidatePath("/finances/transactions");
}

export async function uploadExpenseReceipt(
  organizationId: string,
  expenseId: string,
  formData: FormData,
) {
  await requirePermission(organizationId, "finance.expenses.write");
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Aucun fichier fourni");

  const supabase = await createClient();
  const path = `${organizationId}/expenses/${expenseId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file);
  if (uploadError) throw uploadError;

  const { error } = await supabase
    .from("expenses")
    .update({ receipt_file_path: path })
    .eq("id", expenseId)
    .eq("organization_id", organizationId);
  if (error) throw error;

  revalidatePath(`/finances/depenses/${expenseId}`);
}

export async function createIncomeTransaction(
  organizationId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  try {
    await requirePermission(organizationId, "finance.transactions.write");
  } catch {
    return { error: "Vous n'avez pas la permission d'enregistrer une transaction." };
  }

  const result = incomeFormSchema.safeParse({
    accountId: String(formData.get("accountId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    occurredOn: String(formData.get("occurredOn") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (!result.success) {
    return { error: "Corrigez les champs indiqués." };
  }

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("transactions").insert({
    organization_id: organizationId,
    site_id: siteId,
    account_id: result.data.accountId,
    category_id: result.data.categoryId,
    type: "income",
    amount: Number(result.data.amount),
    currency: result.data.currency,
    occurred_on: result.data.occurredOn,
    description: result.data.description,
    created_by: user?.id,
  });

  if (error) {
    console.error("createIncomeTransaction", error);
    return { error: "Impossible d'enregistrer la transaction." };
  }

  revalidatePath("/finances/transactions");
  return {};
}
