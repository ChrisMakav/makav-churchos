"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelRideNeed } from "../actions";

export function CancelNeedButton({ needId }: { needId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={() => startTransition(() => cancelRideNeed(needId))}>
      Annuler
    </Button>
  );
}
