import type { ReactNode } from "react";
import { CarpoolNavTabs } from "./carpool-nav-tabs";

export default function CovoiturageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <CarpoolNavTabs />
      {children}
    </div>
  );
}
