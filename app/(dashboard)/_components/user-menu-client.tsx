"use client";

import { useTransition } from "react";
import { UserMenu, type CurrentUser } from "@/components/nav/user-menu";
import { signOut } from "@/app/(dashboard)/actions";

export function UserMenuClient({ user }: { user: CurrentUser }) {
  const [, startTransition] = useTransition();

  return <UserMenu user={user} onSignOut={() => startTransition(() => signOut())} />;
}
