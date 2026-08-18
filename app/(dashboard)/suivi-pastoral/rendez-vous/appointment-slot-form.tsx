"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppointmentSlotFormState } from "./actions";

export interface PastorOption {
  id: string;
  fullName: string;
}

export function AppointmentSlotForm({
  action,
  pastors,
  defaultPastorUserId,
}: {
  action: (state: AppointmentSlotFormState, formData: FormData) => Promise<AppointmentSlotFormState>;
  pastors: PastorOption[];
  defaultPastorUserId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const pastorItems = pastors.map((p) => ({ value: p.id, label: p.fullName }));

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="pastorUserId">Pasteur</Label>
        <Select name="pastorUserId" defaultValue={defaultPastorUserId} items={pastorItems}>
          <SelectTrigger id="pastorUserId" className="w-full">
            <SelectValue placeholder="Choisir un pasteur" />
          </SelectTrigger>
          <SelectContent>
            {pastorItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.pastorUserId ? (
          <p className="text-xs text-destructive">{state.fieldErrors.pastorUserId}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Début</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
          {state.fieldErrors?.startsAt ? (
            <p className="text-xs text-destructive">{state.fieldErrors.startsAt}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Fin</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" required />
          {state.fieldErrors?.endsAt ? (
            <p className="text-xs text-destructive">{state.fieldErrors.endsAt}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lieu (optionnel)</Label>
        <Input id="location" name="location" placeholder="Bureau pastoral, appel téléphonique…" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le créneau"}
      </Button>
    </form>
  );
}
