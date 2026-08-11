"use client";

import { useTransition } from "react";
import { OrgSwitcher, type OrgOption } from "@/components/nav/org-switcher";
import { switchOrganization } from "@/app/(dashboard)/actions";

export function OrgSwitcherClient({
  current,
  options,
}: {
  current: OrgOption;
  options: OrgOption[];
}) {
  const [, startTransition] = useTransition();

  return (
    <OrgSwitcher
      current={current}
      options={options}
      onSelect={(id) => startTransition(() => switchOrganization(id))}
    />
  );
}
