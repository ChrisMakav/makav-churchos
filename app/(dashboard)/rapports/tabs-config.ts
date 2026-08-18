import type { Permission } from "@/lib/rbac/permissions";

export interface ReportTabConfig {
  label: string;
  href: string;
  permission: Permission;
}

export const REPORT_TABS: ReportTabConfig[] = [
  { label: "Membres", href: "/rapports/membres", permission: "members.read" },
  { label: "Finances", href: "/rapports/finances", permission: "finance.transactions.read" },
  { label: "Dons", href: "/rapports/dons", permission: "donations.read" },
  { label: "Budgets", href: "/rapports/budgets", permission: "budgets.read" },
  { label: "Événements", href: "/rapports/evenements", permission: "events.read" },
];
