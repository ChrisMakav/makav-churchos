"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/context";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";

export interface NavItem {
  labelKey: DictionaryKey;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  labelKey: DictionaryKey;
  items: NavItem[];
}

interface SidebarProps {
  sections: NavSection[];
  header?: React.ReactNode;
  orgSwitcher?: React.ReactNode;
  siteSwitcher?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Sidebar({ sections, header, orgSwitcher, siteSwitcher, footer }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-6 bg-sidebar px-4 py-5 text-sidebar-foreground">
      {header}
      <div className="space-y-1">
        {orgSwitcher}
        {siteSwitcher}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.labelKey} className="space-y-1">
            <p className="px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              {t(section.labelKey)}
            </p>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {footer}
    </aside>
  );
}
