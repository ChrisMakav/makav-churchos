// Catalogue des codes de permission (module.ressource.action). Source de
// vérité TypeScript — miroir exact du seed dans
// supabase/migrations/0001_tenancy_rbac.sql. Toute permission ajoutée ici doit
// être ajoutée à la migration correspondante (voir docs/architecture/rbac.md).
export const PERMISSIONS = [
  "organization.manage",
  "organization.manage_members",
  "members.read",
  "members.write",
  "families.read",
  "families.write",
  "departments.read",
  "departments.write",
  "events.read",
  "events.write",
  "finance.accounts.read",
  "finance.accounts.write",
  "finance.transactions.read",
  "finance.transactions.write",
  "finance.expenses.read",
  "finance.expenses.write",
  "finance.expenses.approve",
  "donations.read",
  "donations.write",
  "budgets.read",
  "budgets.write",
  "budgets.approve",
  "notifications.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
