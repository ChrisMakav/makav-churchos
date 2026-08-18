import "server-only";
import { createClient } from "@/lib/supabase/server";

export class NotSuperAdminError extends Error {
  constructor() {
    super("Accès réservé aux super administrateurs.");
    this.name = "NotSuperAdminError";
  }
}

export interface BackofficeUser {
  id: string;
  email: string;
  fullName: string;
}

// Garde d'accès au backoffice plateforme — à appeler en tête de chaque page
// et Server Action du groupe (backoffice). S'appuie sur is_super_admin()
// (0021_backoffice.sql), pas sur une vérification ad hoc ici : la RLS reste
// la frontière de sécurité réelle (voir rbac.md), cette fonction sert à
// échouer tôt avec un message clair côté UI.
export async function requireSuperAdmin(): Promise<BackofficeUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new NotSuperAdminError();

  const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");
  if (!isSuperAdmin) throw new NotSuperAdminError();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return { id: user.id, email: user.email ?? "", fullName: profile?.full_name || user.email || "Super admin" };
}
