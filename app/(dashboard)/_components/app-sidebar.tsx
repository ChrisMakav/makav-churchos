"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/nav/sidebar";
import { NAV_SECTIONS, SETTINGS_NAV_ITEM } from "./nav-config";

// Les icônes (composants React) ne peuvent pas traverser la frontière
// Server → Client en tant que prop brute — seul du JSX déjà rendu le peut.
// NAV_SECTIONS est donc importé ici, côté client, plutôt que résolu dans le
// layout serveur puis transmis en prop.
export function AppSidebar({
  header,
  orgSwitcher,
  siteSwitcher,
}: {
  header: ReactNode;
  orgSwitcher: ReactNode;
  siteSwitcher?: ReactNode;
}) {
  const sections = [...NAV_SECTIONS, { labelKey: "nav.systeme" as const, items: [SETTINGS_NAV_ITEM] }];

  return (
    <Sidebar sections={sections} header={header} orgSwitcher={orgSwitcher} siteSwitcher={siteSwitcher} />
  );
}
