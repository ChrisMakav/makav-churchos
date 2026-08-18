"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface MemberInscriptionState {
  error?: string;
  checkEmail?: boolean;
}

// Ne crée jamais de fiche membre — celle-ci doit déjà exister (créée par le
// staff via le module Membres). Cette action se contente de créer le compte
// auth ; le trigger handle_new_user() (0020_member_portal.sql) rattache
// automatiquement la fiche members correspondant à cet email, s'il en existe
// une non réclamée. Voir (member)/mon-espace/layout.tsx pour le message
// affiché si aucune fiche ne correspond.
export async function memberSignUp(
  _prevState: MemberInscriptionState,
  formData: FormData,
): Promise<MemberInscriptionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Tous les champs sont requis." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: "Impossible de créer le compte. Cet email est peut-être déjà utilisé." };
  }

  if (!data.session) {
    return { checkEmail: true };
  }

  redirect("/mon-espace");
}
