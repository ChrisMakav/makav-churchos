"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-url";

export interface InscriptionState {
  error?: string;
  checkEmail?: boolean;
}

export async function signUp(
  _prevState: InscriptionState,
  formData: FormData,
): Promise<InscriptionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Tous les champs sont requis." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await getSiteOrigin()}/connexion`,
    },
  });

  if (error) {
    return { error: "Impossible de créer le compte. Cet email est peut-être déjà utilisé." };
  }

  if (!data.session) {
    return { checkEmail: true };
  }

  redirect("/inscription/organisation");
}
