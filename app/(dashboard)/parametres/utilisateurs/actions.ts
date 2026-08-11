"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface InviteState {
  error?: string;
  success?: boolean;
}

export async function inviteMember(
  organizationId: string,
  _prevState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const email = String(formData.get("email") ?? "").trim();
  const roleCode = String(formData.get("roleCode") ?? "").trim();

  if (!email || !roleCode) {
    return { error: "L'email et le rôle sont requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("invite_member", {
    target_org_id: organizationId,
    member_email: email,
    target_role_code: roleCode,
  });

  if (error) {
    return { error: error.message.includes("duplicate") || error.code === "23505"
      ? "Cette adresse a déjà une invitation en attente."
      : "Impossible d'envoyer l'invitation." };
  }

  revalidatePath("/parametres/utilisateurs");
  return { success: true };
}

export async function changeMemberRole(membershipId: string, roleCode: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_membership_role", {
    target_membership_id: membershipId,
    target_role_code: roleCode,
  });
  if (error) throw error;
  revalidatePath("/parametres/utilisateurs");
}

export async function changeMemberStatus(
  membershipId: string,
  status: "active" | "suspended",
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_membership_status", {
    target_membership_id: membershipId,
    new_status: status,
  });
  if (error) throw error;
  revalidatePath("/parametres/utilisateurs");
}
