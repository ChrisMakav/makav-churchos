"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, BuildingIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Vue d'ensemble", href: "/backoffice", icon: LayoutDashboardIcon },
  { label: "Organisations", href: "/backoffice/organisations", icon: BuildingIcon },
  { label: "Utilisateurs", href: "/backoffice/utilisateurs", icon: UsersIcon },
] as const;

export function BackofficeNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-zinc-800 bg-zinc-900 px-3 py-4">
      {ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
