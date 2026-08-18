import type { ReactNode } from "react";
import { CarpoolTabs } from "./carpool-tabs";

export default function MemberCovoiturageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <CarpoolTabs />
      {children}
    </div>
  );
}
