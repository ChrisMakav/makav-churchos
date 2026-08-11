import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NotificationBell } from "@/components/patterns/notification-bell";
import { OrgProvider } from "@/lib/rbac/context";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "./_components/app-sidebar";
import { OrgSwitcherClient } from "./_components/org-switcher-client";
import { UserMenuClient } from "./_components/user-menu-client";
import { NotificationBellContent } from "./_components/notification-bell-content";

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/connexion");
  }

  const { user, activeOrg, orgOptions } = session;
  const currentOrgOption = orgOptions.find((o) => o.id === activeOrg.organizationId)!;

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

  return (
    <OrgProvider value={activeOrg}>
      <div className="flex min-h-full flex-1">
        <AppSidebar
          header={
            <Link href="/tableau-de-bord" className="flex items-center gap-2 px-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                M
              </span>
              <span>
                <span className="block font-heading text-lg leading-tight text-sidebar-foreground">
                  MAKAV ChurchOS
                </span>
                <span className="block text-[11px] uppercase tracking-wider text-sidebar-foreground/50">
                  Gestion d&apos;église
                </span>
              </span>
            </Link>
          }
          orgSwitcher={
            <OrgSwitcherClient current={currentOrgOption} options={orgOptions} />
          }
        />
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-end gap-3 border-b border-border bg-background px-6">
            <NotificationBell unreadCount={unreadCount}>
              <NotificationBellContent
                notifications={(notifications ?? []).map((n) => ({
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  link: n.link,
                  readAt: n.read_at,
                  createdAt: n.created_at,
                }))}
              />
            </NotificationBell>
            <UserMenuClient
              user={{
                name: user.fullName,
                email: user.email,
                initials: initialsFrom(user.fullName),
              }}
            />
          </header>
          <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
        </div>
      </div>
    </OrgProvider>
  );
}
