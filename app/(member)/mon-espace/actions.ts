"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOutMember() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/mon-espace/connexion");
}

export async function updateMemberPhone(phone: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("members")
    .update({ phone: phone.trim() || null })
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/mon-espace/profil");
}
