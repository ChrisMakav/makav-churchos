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
import { createRideNeed, type CarpoolFormState } from "../actions";

const NO_EVENT = "__none__";

export function RideNeedForm({ events }: { events: { id: string; title: string }[] }) {
  const [state, formAction, pending] = useActionState(createRideNeed, {} as CarpoolFormState);
  const [hasChildren, setHasChildren] = useState(false);

  const eventItems = [{ value: NO_EVENT, label: "Aucun événement précis" }, ...events.map((e) => ({ value: e.id, label: e.title }))];

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

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
        <Label htmlFor="departureLabel">Lieu de départ</Label>
        <Input id="departureLabel" name="departureLabel" required />
        {state.fieldErrors?.departureLabel ? (
          <p className="text-xs text-destructive">{state.fieldErrors.departureLabel}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="neededBy">Horaire souhaité (optionnel)</Label>
          <Input id="neededBy" name="neededBy" type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seatsNeeded">Nombre de places</Label>
          <Input id="seatsNeeded" name="seatsNeeded" type="number" min={1} max={8} defaultValue={1} required />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="hasChildren"
          name="hasChildren"
          checked={hasChildren}
          onCheckedChange={(checked) => setHasChildren(checked === true)}
        />
        <Label htmlFor="hasChildren" className="font-normal">
          Avec enfant(s)
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Précisions (optionnel)</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Signaler mon besoin"}
      </Button>
    </form>
  );
}
