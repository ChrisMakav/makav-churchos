import "server-only";
import { createClient } from "@/lib/supabase/server";

// P1 ne gère qu'un seul site par organisation (pas encore de multisite en
// UI). Les Server Actions qui créent une ressource site-scoped (membre,
// famille, futur département/événement…) utilisent ce site par défaut plutôt
// que de faire choisir un site à l'utilisateur.
export async function getDefaultSiteId(organizationId: string): Promise<string> {
  const supabase = await createClient();
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
