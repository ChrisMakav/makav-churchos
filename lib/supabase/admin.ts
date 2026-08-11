import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Client "service role" : contourne RLS. Réservé aux opérations serveur qui ne
// peuvent pas passer par une RPC SECURITY DEFINER (ex. tâches cron). Ne jamais
// exposer ce client ou la clé SUPABASE_SERVICE_ROLE_KEY au navigateur.
let cachedAdminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (!cachedAdminClient) {
    cachedAdminClient = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return cachedAdminClient;
}
