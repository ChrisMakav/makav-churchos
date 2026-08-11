import type { ReactNode } from "react";
import { SettingsTabs } from "./settings-tabs";

export default function ParametresLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <SettingsTabs />
      {children}
    </div>
  );
}
