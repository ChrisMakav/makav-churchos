"use client";

import { useTransition } from "react";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setTransactionReconciled } from "../actions";

export function ReconcileToggle({
  organizationId,
  transactionId,
  reconciled,
}: {
  organizationId: string;
  transactionId: string;
  reconciled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={reconciled ? "secondary" : "outline"}
      size="sm"
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        startTransition(() =>
          setTransactionReconciled(organizationId, transactionId, !reconciled),
        );
      }}
    >
      {reconciled ? <CheckIcon className="h-3.5 w-3.5" /> : null}
      {reconciled ? "Rapproché" : "Rapprocher"}
    </Button>
  );
}
