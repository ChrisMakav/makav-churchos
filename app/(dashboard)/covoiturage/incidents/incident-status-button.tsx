"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resolveIncident, reopenIncident } from "../actions";

export function IncidentStatusButton({
  organizationId,
  incidentId,
  status,
}: {
  organizationId: string;
  incidentId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  if (status === "open") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => resolveIncident(organizationId, incidentId))}
      >
        Marquer résolu
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => reopenIncident(organizationId, incidentId))}
    >
      Rouvrir
    </Button>
  );
}
