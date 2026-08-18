"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteVehicle } from "../actions";

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => deleteVehicle(vehicleId))}
    >
      Supprimer
    </Button>
  );
}
