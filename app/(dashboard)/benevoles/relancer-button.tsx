"use client";

import { useTransition } from "react";
import { BellRingIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { relancerNonConfirmes } from "./actions";

export function RelancerButton({
  organizationId,
  pendingCount,
}: {
  organizationId: string;
  pendingCount: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending || pendingCount === 0}
      onClick={() =>
        startTransition(async () => {
          const count = await relancerNonConfirmes(organizationId);
          toast.success(
            count > 0
              ? `${count} relance${count > 1 ? "s" : ""} envoyée${count > 1 ? "s" : ""}.`
              : "Aucun bénévole notifiable pour le moment.",
          );
        })
      }
    >
      <BellRingIcon className="h-4 w-4" />
      Relancer les non-confirmés
    </Button>
  );
}
