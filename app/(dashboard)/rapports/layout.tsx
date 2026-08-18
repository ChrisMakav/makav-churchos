import type { ReactNode } from "react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { getSession } from "@/lib/session";
import { ReportTabs } from "./report-tabs";
import { REPORT_TABS } from "./tabs-config";

export default async function RapportsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) return null;

  const allowedTabs = REPORT_TABS.filter((tab) =>
    session.activeOrg.permissions.includes(tab.permission),
  );

  if (allowedTabs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapports" />
        <EmptyState
          title="Aucun rapport accessible"
          description="Votre rôle ne vous donne accès à aucun module de rapport pour le moment."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportTabs tabs={allowedTabs} />
      {children}
    </div>
  );
}
