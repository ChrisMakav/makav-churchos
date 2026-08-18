"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/backoffice/guard";

export async function updateOrganizationPlan(organizationId: string, plan: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ plan }).eq("id", organizationId);
  if (error) throw error;
  revalidatePath(`/backoffice/organisations/${organizationId}`);
  revalidatePath("/backoffice/organisations");
  revalidatePath("/backoffice");
}
