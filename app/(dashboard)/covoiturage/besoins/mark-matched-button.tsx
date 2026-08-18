"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markRideNeedMatched } from "../actions";

export function MarkMatchedButton({ organizationId, needId }: { organizationId: string; needId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => markRideNeedMatched(organizationId, needId))}
    >
      Marquer traité
    </Button>
  );
}
