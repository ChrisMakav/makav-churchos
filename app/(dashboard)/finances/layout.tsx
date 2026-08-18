import type { ReactNode } from "react";
import { FinanceNavTabs } from "@/components/patterns/finance-nav-tabs";

export default function FinancesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <FinanceNavTabs />
      {children}
    </div>
  );
}
