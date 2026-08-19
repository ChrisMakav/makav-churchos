"use client";

import { useTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  CalendarDaysIcon,
  CalendarHeartIcon,
  CarIcon,
  HandCoinsIcon,
  HomeIcon,
  UsersIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { signOutMember } from "../actions";

const NAV_ITEMS = [
  { href: "/mon-espace", label: "Accueil", icon: HomeIcon },
  { href: "/mon-espace/dons", label: "Mes dons", icon: HandCoinsIcon },
  { href: "/mon-espace/groupe", label: "Mon groupe", icon: UsersIcon },
  { href: "/mon-espace/evenements", label: "Événements", icon: CalendarDaysIcon },
  { href: "/mon-espace/rendez-vous", label: "Rendez-vous", icon: CalendarHeartIcon },
  { href: "/mon-espace/covoiturage", label: "Covoiturage", icon: CarIcon },
  { href: "/mon-espace/notifications", label: "Notifications", icon: BellIcon },
] as const;

function initialsFrom(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
}

export function MemberShell({
  fullName,
  email,
  unreadCount,
  children,
}: {
  fullName: string;
  email: string;
  unreadCount: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const initials = initialsFrom(fullName.split(" ")[0] ?? "", fullName.split(" ").slice(1).join(" "));

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
        <Link href="/mon-espace" className="flex shrink-0 items-center gap-2">
          <Image src="/logo-icon.png" alt="" width={28} height={28} className="h-7 w-7" priority />
          <span className="hidden font-heading text-base text-foreground sm:inline">MAKAV ChurchOS</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
                {item.href === "/mon-espace/notifications" && unreadCount > 0 ? (
                  <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px]">
                    {unreadCount}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" className="shrink-0 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className="block truncate text-sm font-medium">{fullName}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/mon-espace/profil" />}>Mon profil</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => startTransition(() => signOutMember())}>
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
