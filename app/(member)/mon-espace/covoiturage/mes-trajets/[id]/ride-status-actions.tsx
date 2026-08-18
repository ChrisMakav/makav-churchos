"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelRide, markArrived, reportDelay } from "../../actions";

export function RideStatusActions({ rideId }: { rideId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [delayMinutes, setDelayMinutes] = useState("10");

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={delayMinutes}
          onChange={(e) => setDelayMinutes(e.target.value)}
          className="w-20"
        />
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => reportDelay(rideId, delayMinutes))}
        >
          Signaler un retard
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => markArrived(rideId))}
      >
        Je suis arrivé(e)
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await cancelRide(rideId);
            router.refresh();
          })
        }
      >
        Annuler le trajet
      </Button>
    </div>
  );
}
