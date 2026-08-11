"use client";

import { Bell } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  unreadCount?: number;
  children: ReactNode;
}

export function NotificationBell({ unreadCount = 0, children }: NotificationBellProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span
                className={cn(
                  "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground",
                )}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="max-h-96 overflow-y-auto p-2">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
