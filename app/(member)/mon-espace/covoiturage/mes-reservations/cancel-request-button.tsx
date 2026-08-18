"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelMyRequest } from "../actions";

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => cancelMyRequest(requestId))}
    >
      Annuler
    </Button>
  );
}
