import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { NotificationBellContent } from "@/app/(dashboard)/_components/notification-bell-content";

export default async function MesNotificationsPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" />
      {!notifications || notifications.length === 0 ? (
        <EmptyState title="Aucune notification" />
      ) : (
        <div className="rounded-xl border border-border bg-card p-2">
          <NotificationBellContent
            notifications={notifications.map((n) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              link: n.link,
              readAt: n.read_at,
              createdAt: n.created_at,
            }))}
          />
        </div>
      )}
    </div>
  );
}
