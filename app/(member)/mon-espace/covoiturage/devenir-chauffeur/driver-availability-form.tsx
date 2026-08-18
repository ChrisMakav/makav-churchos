"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertDriverAvailability, type CarpoolFormState } from "../actions";

const NO_VEHICLE = "__none__";

export function DriverAvailabilityForm({
  vehicles,
  initialValues,
}: {
  vehicles: { id: string; label: string }[];
  initialValues?: {
    vehicleId: string;
    zones: string;
    frequency: string;
    notes: string;
    isActive: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(upsertDriverAvailability, {} as CarpoolFormState);
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);

  const vehicleItems = [
    { value: NO_VEHICLE, label: "Aucun véhicule renseigné" },
    ...vehicles.map((v) => ({ value: v.id, label: v.label })),
  ];

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="vehicleId">Véhicule</Label>
        <Select name="vehicleId" defaultValue={initialValues?.vehicleId || NO_VEHICLE} items={vehicleItems}>
          <SelectTrigger id="vehicleId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {vehicleItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zones">Zones desservies (optionnel)</Label>
        <Input id="zones" name="zones" defaultValue={initialValues?.zones} placeholder="Centre-ville, Nord…" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Fréquence (optionnel)</Label>
        <Input id="frequency" name="frequency" defaultValue={initialValues?.frequency} placeholder="Tous les dimanches" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={initialValues?.notes} />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isActive"
          name="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
        />
        <Label htmlFor="isActive" className="font-normal">
          Je suis actuellement disponible
        </Label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer ma disponibilité"}
      </Button>
    </form>
  );
}
