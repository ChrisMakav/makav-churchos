"use client";

import { useTransition } from "react";
import { LocaleSwitcher } from "@/components/nav/locale-switcher";
import { setLocale } from "@/app/(dashboard)/actions";
import { useTranslations } from "@/lib/i18n/context";

export function LocaleSwitcherClient() {
  const { locale } = useTranslations();
  const [, startTransition] = useTransition();

  return <LocaleSwitcher locale={locale} onSelect={(l) => startTransition(() => setLocale(l))} />;
}
