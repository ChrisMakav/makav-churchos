"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Permission } from "@/lib/rbac/permissions";

export interface OrgContextValue {
  organizationId: string;
  organizationName: string;
  siteId: string | null;
  roleCode: string;
  roleLabel: string;
  permissions: Permission[];
}

const OrgContext = createContext<OrgContextValue | null>(null);

// Résolu côté serveur dans (dashboard)/layout.tsx et transmis ici pour que les
// Client Components puissent masquer/afficher de l'UI selon les permissions —
// à titre d'UX uniquement. La vérification qui compte se fait côté serveur
// via lib/rbac/guard.ts (requirePermission) et les policies RLS.
export function OrgProvider({
  value,
  children,
}: {
  value: OrgContextValue;
  children: ReactNode;
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg doit être utilisé sous OrgProvider");
  return context;
}

export function useHasPermission(permission: Permission) {
  const { permissions } = useOrg();
  return permissions.includes(permission);
}
