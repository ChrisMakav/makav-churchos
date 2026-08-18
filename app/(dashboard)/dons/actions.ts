"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { donationFormSchema, donationFundFormSchema } from "@/lib/validation/donations";

export interface DonationFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const NO_MEMBER_SENTINEL = "__anonymous__";

export async function createDonation(
  organizationId: string,
  _prevState: DonationFormState,
  formData: FormData,
): Promise<DonationFormState> {
  const memberIdRaw = String(formData.get("memberId") ?? "");
  const result = donationFormSchema.safeParse({
    accountId: String(formData.get("accountId") ?? ""),
    fundId: String(formData.get("fundId") ?? ""),
    memberId: memberIdRaw === NO_MEMBER_SENTINEL ? "" : memberIdRaw,
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    method: String(formData.get("method") ?? "cash"),
    givenAt: String(formData.get("givenAt") ?? ""),
    isAnonymous: formData.get("isAnonymous") === "on",
    isRecurring: formData.get("isRecurring") === "on",
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

  const { data, error } = await supabase.rpc("create_donation", {
    target_org_id: organizationId,
    target_site_id: siteId,
    target_account_id: result.data.accountId,
    target_fund_id: result.data.fundId,
    // target_member_id est un uuid nullable côté SQL (don anonyme) ; les types
    // générés par `supabase gen types` ne marquent pas les params de RPC
    // comme nullable même quand ils le sont réellement.
    target_member_id: result.data.memberId as unknown as string,
    target_amount: Number(result.data.amount),
    target_currency: result.data.currency,
    target_method: result.data.method,
    target_given_at: result.data.givenAt,
    target_is_anonymous: result.data.isAnonymous,
    target_is_recurring: result.data.isRecurring,
  });

  if (error) {
    console.error("createDonation", error);
    return { error: "Impossible d'enregistrer le don." };
  }

  revalidatePath("/dons");
  revalidatePath("/finances");
  revalidatePath("/finances/transactions");
  redirect(`/dons/${data}`);
}

// --- Fonds / projets --------------------------------------------------------

function parseDonationFundForm(formData: FormData) {
  const result = donationFundFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    isRestricted: formData.get("isRestricted") === "on",
    isActive: formData.get("isActive") === "on",
    goalAmount: String(formData.get("goalAmount") ?? ""),
    startsOn: String(formData.get("startsOn") ?? ""),
    endsOn: String(formData.get("endsOn") ?? ""),
  });
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Fonds invalide.");
  }
  return result.data;
}

export async function createDonationFund(organizationId: string, formData: FormData) {
  await requirePermission(organizationId, "donations.write");
  const data = parseDonationFundForm(formData);

  const supabase = await createClient();
  const { error } = await supabase.from("donation_funds").insert({
    organization_id: organizationId,
    name: data.name,
    is_restricted: data.isRestricted,
    is_active: data.isActive,
    goal_amount: data.goalAmount,
    starts_on: data.startsOn,
    ends_on: data.endsOn,
  });
  if (error) throw error;
  revalidatePath("/finances");
  revalidatePath("/dons/projets");
  revalidatePath("/dons/nouveau");
}

export async function updateDonationFund(
  organizationId: string,
  fundId: string,
  formData: FormData,
) {
  await requirePermission(organizationId, "donations.write");
  const data = parseDonationFundForm(formData);

  const supabase = await createClient();
  const { error } = await supabase
    .from("donation_funds")
    .update({
      name: data.name,
      is_restricted: data.isRestricted,
      is_active: data.isActive,
      goal_amount: data.goalAmount,
      starts_on: data.startsOn,
      ends_on: data.endsOn,
    })
    .eq("id", fundId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/finances");
  revalidatePath("/dons/projets");
}

export async function deleteDonationFund(organizationId: string, fundId: string) {
  await requirePermission(organizationId, "donations.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("donation_funds")
    .delete()
    .eq("id", fundId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/finances");
  revalidatePath("/dons/projets");
}

// --- Reçus fiscaux annuels ---------------------------------------------------

export async function generateAnnualReceipts(organizationId: string, year: number) {
  await requirePermission(organizationId, "donations.write");
  const supabase = await createClient();
  const { error } = await supabase.rpc("generate_annual_receipts", {
    target_org_id: organizationId,
    target_year: year,
  });
  if (error) throw error;
  revalidatePath("/finances");
  revalidatePath("/dons/recus-annuels");
  redirect("/dons/recus-annuels");
}
