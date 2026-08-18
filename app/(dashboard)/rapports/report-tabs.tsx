"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ReportTab {
  label: string;
  href: string;
}

export function ReportTabs({ tabs }: { tabs: ReportTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
