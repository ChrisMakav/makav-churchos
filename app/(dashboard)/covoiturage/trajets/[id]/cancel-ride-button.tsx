"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelRideStaff } from "../../actions";

export function CancelRideButton({
  organizationId,
  rideId,
}: {
  organizationId: string;
  rideId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() => startTransition(() => cancelRideStaff(organizationId, rideId))}
    >
      Annuler ce trajet
    </Button>
  );
}
