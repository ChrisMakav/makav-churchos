"use client";

import { useTransition } from "react";
import { UserMenu, type CurrentUser } from "@/components/nav/user-menu";
import { signOut } from "@/app/(dashboard)/actions";
import { useTranslations } from "@/lib/i18n/context";

export function UserMenuClient({ user, isSuperAdmin }: { user: CurrentUser; isSuperAdmin?: boolean }) {
  const [, startTransition] = useTransition();
  const { t } = useTranslations();

  return (
    <UserMenu
      user={user}
      onSignOut={() => startTransition(() => signOut())}
      labels={{ settings: t("common.settings"), signOut: t("common.signOut") }}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
