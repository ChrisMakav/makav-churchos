"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ConnexionState {
  error?: string;
}

export async function signIn(
  _prevState: ConnexionState,
  formData: FormData,
): Promise<ConnexionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Renseignez votre email et votre mot de passe." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  const { count: staffCount } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (staffCount) {
    redirect("/tableau-de-bord");
  }

  // Pas de membership staff active : ce compte est peut-être seulement un
  // membre (portail /mon-espace, voir 0020_member_portal.sql). Sans ce
  // contrôle, un membre connecté via ce formulaire staff se retrouvait
  // renvoyé vers /inscription/organisation par le proxy (needsOnboardingCheck),
  // qui ne sait vérifier que les memberships — pas les fiches membres.
  const { count: memberCount } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", data.user.id);

  redirect(memberCount ? "/mon-espace" : "/inscription/organisation");
}
