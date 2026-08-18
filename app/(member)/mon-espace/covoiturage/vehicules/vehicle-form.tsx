"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createVehicle, type CarpoolFormState } from "../actions";

export function VehicleForm() {
  const [state, formAction, pending] = useActionState(createVehicle, {} as CarpoolFormState);
  const [isPmrAccessible, setIsPmrAccessible] = useState(false);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Marque</Label>
          <Input id="brand" name="brand" required />
          {state.fieldErrors?.brand ? <p className="text-xs text-destructive">{state.fieldErrors.brand}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Modèle</Label>
          <Input id="model" name="model" required />
          {state.fieldErrors?.model ? <p className="text-xs text-destructive">{state.fieldErrors.model}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Couleur (optionnel)</Label>
          <Input id="color" name="color" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seatCapacity">Nombre de places</Label>
          <Input id="seatCapacity" name="seatCapacity" type="number" min={1} max={20} defaultValue={4} required />
          {state.fieldErrors?.seatCapacity ? (
            <p className="text-xs text-destructive">{state.fieldErrors.seatCapacity}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plateRaw">Immatriculation (optionnel, sera masquée)</Label>
        <Input id="plateRaw" name="plateRaw" placeholder="AB-123-CD" />
        <p className="text-xs text-muted-foreground">
          Seuls les 2 premiers et 2 derniers caractères resteront visibles.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isPmrAccessible"
          name="isPmrAccessible"
          checked={isPmrAccessible}
          onCheckedChange={(checked) => setIsPmrAccessible(checked === true)}
        />
        <Label htmlFor="isPmrAccessible" className="font-normal">
          Véhicule accessible PMR
        </Label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Ajouter le véhicule"}
      </Button>
    </form>
  );
}
