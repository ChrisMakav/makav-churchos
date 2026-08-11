import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Permission } from "@/lib/rbac/permissions";
import type { OrgContextValue } from "@/lib/rbac/context";

export const ACTIVE_ORG_COOKIE = "active_organization_id";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
}

export interface OrgOptionData {
  id: string;
  name: string;
  subtitle: string;
  initials: string;
}

export interface SessionData {
  user: CurrentUser;
  activeOrg: OrgContextValue;
  orgOptions: OrgOptionData[];
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

// Résout l'utilisateur courant, son organisation active et ses permissions.
// Appelé une fois par requête depuis (dashboard)/layout.tsx. Retourne null si
// aucune session ou aucune membership active — le proxy garde déjà l'accès à
// ce shell, ce cas ne devrait donc pas se présenter en usage normal.
export async function getSession(): Promise<SessionData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberships } = await supabase
    .from("memberships")
    .select(
      "id, organization_id, site_id, role_id, organizations(id, name), roles(code, label_fr)",
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) return null;

  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  const active =
    memberships.find((m) => m.organization_id === preferredOrgId) ?? memberships[0]!;

  const { data: permissionRows } = await supabase
    .from("role_permissions")
    .select("permissions(code)")
    .eq("role_id", active.role_id);

  const permissions = (permissionRows ?? [])
    .map((row) => row.permissions?.code)
    .filter((code): code is Permission => Boolean(code));

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = profile?.full_name || user.email || "Utilisateur";

  return {
    user: { id: user.id, email: user.email ?? "", fullName },
    activeOrg: {
      organizationId: active.organization_id,
      organizationName: active.organizations?.name ?? "Organisation",
      siteId: active.site_id,
      roleCode: active.roles?.code ?? "member",
      roleLabel: active.roles?.label_fr ?? "Membre",
      permissions,
    },
    orgOptions: memberships.map((m) => ({
      id: m.organization_id,
      name: m.organizations?.name ?? "Organisation",
      subtitle: m.roles?.label_fr ?? "Membre",
      initials: initialsFrom(m.organizations?.name ?? "OR"),
    })),
  };
}
