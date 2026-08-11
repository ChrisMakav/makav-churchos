"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "../notifications/actions";

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const relativeFormatter = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

function relativeTime(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) < 24) return relativeFormatter.format(diffHours, "hour");
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return relativeFormatter.format(diffDays, "day");
}

export function NotificationBellContent({ notifications }: { notifications: NotificationItem[] }) {
  const [pending, startTransition] = useTransition();

  if (notifications.length === 0) {
    return <p className="p-3 text-sm text-muted-foreground">Aucune notification pour le moment.</p>;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-xs font-medium text-muted-foreground">Notifications</span>
        <Button
          variant="ghost"
          size="xs"
          disabled={pending}
          onClick={() => startTransition(() => markAllNotificationsRead())}
        >
          Tout marquer lu
        </Button>
      </div>
      {notifications.map((n) => (
        <Link
          key={n.id}
          href={n.link ?? "/notifications"}
          onClick={() => {
            if (!n.readAt) startTransition(() => markNotificationRead(n.id));
          }}
          className="block rounded-lg px-2 py-2 text-sm hover:bg-muted"
        >
          <div className="flex items-start gap-2">
            {!n.readAt ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> : null}
            <div className={!n.readAt ? "" : "pl-3.5"}>
              <p className="font-medium text-foreground">{n.title}</p>
              {n.body ? <p className="text-xs text-muted-foreground">{n.body}</p> : null}
              <p className="text-xs text-muted-foreground/70">{relativeTime(n.createdAt)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
