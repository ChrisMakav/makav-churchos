import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { REPORT_TABS } from "./tabs-config";

export default async function RapportsPage() {
  const session = await getSession();
  if (!session) return null;

  const firstAllowed = REPORT_TABS.find((tab) =>
    session.activeOrg.permissions.includes(tab.permission),
  );

  if (!firstAllowed) return null;

  redirect(firstAllowed.href);
}
