"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface OrganisationState {
  error?: string;
}

const CURRENCIES = ["XAF", "XOF", "EUR", "USD", "CAD"] as const;

export async function createOrganization(
  _prevState: OrganisationState,
  formData: FormData,
): Promise<OrganisationState> {
  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "XAF");
  const timezone = String(formData.get("timezone") ?? "Africa/Douala");

  if (!name) {
    return { error: "Le nom de l'organisation est requis." };
  }

  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    return { error: "Devise invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization", {
    org_name: name,
    org_currency: currency,
    org_timezone: timezone,
  });

  if (error) {
    return { error: "Impossible de créer l'organisation. Réessayez." };
  }

  redirect("/tableau-de-bord");
}
