import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Permission } from "@/lib/rbac/permissions";

export class PermissionDeniedError extends Error {
  constructor(permission: Permission) {
    super(`Permission refusée : ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

// À appeler en tête de chaque Server Action / Route Handler mutant des
// données. RLS reste la frontière de sécurité réelle (voir
// docs/architecture/rbac.md) — cette fonction sert à échouer tôt avec un
// message clair plutôt que de laisser Postgres renvoyer une erreur RLS opaque.
export async function requirePermission(organizationId: string, permission: Permission) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", {
    org_id: organizationId,
    perm_code: permission,
  });

  if (error) throw error;
  if (!data) throw new PermissionDeniedError(permission);
}
