"use client";

import Link from "next/link";
import { LogOut, Settings, ShieldIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CurrentUser {
  name: string;
  email: string;
  avatarUrl?: string | null;
  initials: string;
}

interface UserMenuProps {
  user: CurrentUser;
  onSignOut?: () => void;
  labels?: { settings: string; signOut: string };
  isSuperAdmin?: boolean;
}

export function UserMenu({
  user,
  onSignOut,
  labels = { settings: "Paramètres", signOut: "Se déconnecter" },
  isSuperAdmin = false,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" className="rounded-full">
            <Avatar className="h-8 w-8">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/parametres/organisation" />}>
          <Settings className="h-4 w-4" />
          {labels.settings}
        </DropdownMenuItem>
        {isSuperAdmin ? (
          <DropdownMenuItem render={<Link href="/backoffice" />}>
            <ShieldIcon className="h-4 w-4" />
            Backoffice
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          <LogOut className="h-4 w-4" />
          {labels.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
