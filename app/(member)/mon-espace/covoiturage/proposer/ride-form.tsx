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
import { createRide } from "../actions";
import type { CarpoolFormState } from "../actions";

const NO_EVENT = "__none__";

interface Preference {
  name: string;
  label: string;
  defaultChecked: boolean;
}

const PREFERENCES: Preference[] = [
  { name: "acceptsChildren", label: "Accepte les enfants", defaultChecked: true },
  { name: "acceptsLuggage", label: "Accepte les bagages", defaultChecked: true },
  { name: "acceptsPets", label: "Accepte les animaux", defaultChecked: false },
  { name: "nonSmoking", label: "Trajet non-fumeur", defaultChecked: true },
  { name: "hasAirConditioning", label: "Climatisation", defaultChecked: false },
  { name: "isPmrAccessible", label: "Accessible PMR", defaultChecked: false },
];

export function RideForm({
  vehicles,
  events,
}: {
  vehicles: { id: string; label: string; seatCapacity: number }[];
  events: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(createRide, {} as CarpoolFormState);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFERENCES.map((p) => [p.name, p.defaultChecked])),
  );

  const eventItems = [{ value: NO_EVENT, label: "Aucun événement précis" }, ...events.map((e) => ({ value: e.id, label: e.title }))];
  const vehicleItems = vehicles.map((v) => ({ value: v.id, label: v.label }));
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="eventId">Événement (optionnel)</Label>
          <Select name="eventId" defaultValue={NO_EVENT} items={eventItems}>
            <SelectTrigger id="eventId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicleId">Véhicule</Label>
          <Select name="vehicleId" value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")} items={vehicleItems}>
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="departureLabel">Lieu de départ</Label>
          <Input id="departureLabel" name="departureLabel" required />
          {state.fieldErrors?.departureLabel ? (
            <p className="text-xs text-destructive">{state.fieldErrors.departureLabel}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="destinationLabel">Destination</Label>
          <Input id="destinationLabel" name="destinationLabel" required />
          {state.fieldErrors?.destinationLabel ? (
            <p className="text-xs text-destructive">{state.fieldErrors.destinationLabel}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="departsAt">Heure de départ</Label>
          <Input id="departsAt" name="departsAt" type="datetime-local" required />
          {state.fieldErrors?.departsAt ? (
            <p className="text-xs text-destructive">{state.fieldErrors.departsAt}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedArrivalAt">Arrivée estimée (optionnel)</Label>
          <Input id="estimatedArrivalAt" name="estimatedArrivalAt" type="datetime-local" />
          {state.fieldErrors?.estimatedArrivalAt ? (
            <p className="text-xs text-destructive">{state.fieldErrors.estimatedArrivalAt}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="seatCapacity">Places proposées</Label>
          <Input
            id="seatCapacity"
            name="seatCapacity"
            type="number"
            min={1}
            max={selectedVehicle?.seatCapacity ?? 8}
            defaultValue={Math.min(3, selectedVehicle?.seatCapacity ?? 3)}
            required
          />
          {state.fieldErrors?.seatCapacity ? (
            <p className="text-xs text-destructive">{state.fieldErrors.seatCapacity}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="autoConfirm"
          name="autoConfirm"
          checked={autoConfirm}
          onCheckedChange={(checked) => setAutoConfirm(checked === true)}
        />
        <Label htmlFor="autoConfirm" className="font-normal">
          Confirmer automatiquement les demandes tant qu&apos;il reste des places
        </Label>
      </div>

      <div className="space-y-2 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-foreground">Préférences</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PREFERENCES.map((pref) => (
            <div key={pref.name} className="flex items-center gap-2">
              <Checkbox
                id={pref.name}
                name={pref.name}
                checked={prefs[pref.name]}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [pref.name]: checked === true }))}
              />
              <Label htmlFor={pref.name} className="font-normal">
                {pref.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="recurrenceEnabled"
            name="recurrenceEnabled"
            checked={recurrenceEnabled}
            onCheckedChange={(checked) => setRecurrenceEnabled(checked === true)}
          />
          <Label htmlFor="recurrenceEnabled" className="font-normal">
            Trajet récurrent (chaque semaine, même heure)
          </Label>
        </div>
        {recurrenceEnabled ? (
          <div className="space-y-2 pt-2">
            <Label htmlFor="recurrenceUntil">Jusqu&apos;au</Label>
            <Input id="recurrenceUntil" name="recurrenceUntil" type="date" required={recurrenceEnabled} />
            {state.fieldErrors?.recurrenceUntil ? (
              <p className="text-xs text-destructive">{state.fieldErrors.recurrenceUntil}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">Maximum 26 occurrences générées.</p>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Proposer le trajet"}
      </Button>
    </form>
  );
}
