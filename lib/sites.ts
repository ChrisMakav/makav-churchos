import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_SITE_COOKIE } from "@/lib/session";

// Site auquel rattacher une ressource nouvellement créée (membre, famille,
// département, événement…) quand l'utilisateur n'en choisit pas un
// explicitement dans le formulaire. Respecte le site actif choisi via le
// sélecteur de campus (cookie ACTIVE_SITE_COOKIE, voir getSession) — retombe
// sur le premier site de l'organisation si le cookie est absent/invalide
// (comportement historique, seul cas possible tant qu'une organisation n'a
// qu'un seul site).
//
// Changer cette fonction suffit à faire respecter le site actif à TOUTES les
// Server Actions de création existantes (elles appellent toutes
// getDefaultSiteId, jamais un site_id choisi côté client) — point d'entrée
// unique volontaire plutôt que de modifier chaque action individuellement.
export async function getDefaultSiteId(organizationId: string): Promise<string> {
  const cookieStore = await cookies();
  const preferredSiteId = cookieStore.get(ACTIVE_SITE_COOKIE)?.value;

  const supabase = await createClient();

  if (preferredSiteId) {
    const { data: preferred } = await supabase
      .from("sites")
      .select("id")
      .eq("id", preferredSiteId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (preferred) return preferred.id;
  }

  const { data, error } = await supabase
    .from("sites")
    .select("id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) throw new Error("Aucun site trouvé pour cette organisation");
  return data.id;
}
