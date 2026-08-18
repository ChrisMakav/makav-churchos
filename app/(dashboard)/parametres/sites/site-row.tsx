"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleSiteActive } from "./actions";

export function SiteRow({
  organizationId,
  siteId,
  name,
  type,
  address,
  memberCount,
  isActive,
  isRoot,
}: {
  organizationId: string;
  siteId: string;
  name: string;
  type: string;
  address: string | null;
  memberCount: number;
  isActive: boolean;
  isRoot: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <Badge variant="outline">{type === "church" ? "Siège" : "Campus"}</Badge>
          {!isActive ? <Badge variant="secondary">Inactif</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {address ? `${address} · ` : ""}
          {memberCount} membre{memberCount > 1 ? "s" : ""}
        </p>
      </div>
      {!isRoot ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => toggleSiteActive(organizationId, siteId, !isActive))}
        >
          {isActive ? "Désactiver" : "Réactiver"}
        </Button>
      ) : null}
    </div>
  );
}
