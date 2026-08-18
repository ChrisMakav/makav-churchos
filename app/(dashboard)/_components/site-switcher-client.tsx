"use client";

import { useTransition } from "react";
import { SiteSwitcher, type SiteOption } from "@/components/nav/site-switcher";
import { switchSite } from "@/app/(dashboard)/actions";

export function SiteSwitcherClient({
  current,
  options,
}: {
  current: SiteOption;
  options: SiteOption[];
}) {
  const [, startTransition] = useTransition();

  return (
    <SiteSwitcher
      current={current}
      options={options}
      onSelect={(id) => startTransition(() => switchSite(id))}
    />
  );
}
