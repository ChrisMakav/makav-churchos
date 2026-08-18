import type { ReactNode } from "react";
import { PastoralNavTabs } from "./pastoral-nav-tabs";

export default function SuiviPastoralLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <PastoralNavTabs />
      {children}
    </div>
  );
}
