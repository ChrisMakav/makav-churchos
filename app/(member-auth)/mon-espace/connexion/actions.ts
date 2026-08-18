"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface MemberConnexionState {
  error?: string;
}

export async function memberSignIn(
  _prevState: MemberConnexionState,
  formData: FormData,
): Promise<MemberConnexionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Renseignez votre email et votre mot de passe." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/mon-espace");
}
