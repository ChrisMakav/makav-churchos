import type { ReactNode } from "react";
import { FinanceTabs } from "./finance-tabs";

export default function FinancesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <FinanceTabs />
      {children}
    </div>
  );
}
