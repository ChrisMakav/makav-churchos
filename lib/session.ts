import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Permission } from "@/lib/rbac/permissions";
import type { OrgContextValue } from "@/lib/rbac/context";

export const ACTIVE_ORG_COOKIE = "active_organization_id";
export const ACTIVE_SITE_COOKIE = "active_site_id";

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

export interface SiteOptionData {
  id: string;
  name: string;
  subtitle: string;
}

export interface SessionData {
  user: CurrentUser;
  activeOrg: OrgContextValue;
  orgOptions: OrgOptionData[];
  siteOptions: SiteOptionData[];
  isSuperAdmin: boolean;
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

  const [{ data: sites }, { data: memberCounts }] = await Promise.all([
    supabase.from("sites").select("id, name").eq("organization_id", active.organization_id).order("created_at"),
    supabase.from("members").select("site_id").eq("organization_id", active.organization_id),
  ]);

  const countBySite = new Map<string, number>();
  for (const row of memberCounts ?? []) {
    countBySite.set(row.site_id, (countBySite.get(row.site_id) ?? 0) + 1);
  }

  const preferredSiteId = cookieStore.get(ACTIVE_SITE_COOKIE)?.value;
  const activeSiteId =
    (sites ?? []).find((s) => s.id === preferredSiteId)?.id ??
    (sites ?? []).find((s) => s.id === active.site_id)?.id ??
    sites?.[0]?.id ??
    null;

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
      siteId: activeSiteId,
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
    siteOptions: (sites ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      subtitle: `${countBySite.get(s.id) ?? 0} membre${(countBySite.get(s.id) ?? 0) > 1 ? "s" : ""}`,
    })),
    // Réutilise la même requête memberships (déjà .eq("status","active")) —
    // un super_admin peut l'être via n'importe laquelle de ses organisations,
    // le rôle n'est pas scopé à l'organisation active. Voir 0021_backoffice.sql.
    isSuperAdmin: memberships.some((m) => m.roles?.code === "super_admin"),
  };
}
