"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NEW_CHILD_SENTINEL, NO_EVENT_SENTINEL } from "@/lib/validation/checkin";
import type { CheckinFormState } from "./actions";

export interface ChildOption {
  id: string;
  fullName: string;
}

export interface EventOption {
  id: string;
  title: string;
}

export function CheckinForm({
  action,
  childOptions,
  events,
}: {
  action: (state: CheckinFormState, formData: FormData) => Promise<CheckinFormState>;
  childOptions: ChildOption[];
  events: EventOption[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [childMemberId, setChildMemberId] = useState("");

  const childItems = [
    { value: NEW_CHILD_SENTINEL, label: "+ Nouvel enfant" },
    ...childOptions.map((c) => ({ value: c.id, label: c.fullName })),
  ];
  const eventItems = [
    { value: NO_EVENT_SENTINEL, label: "Aucun" },
    ...events.map((e) => ({ value: e.id, label: e.title })),
  ];
  const isNewChild = childMemberId === NEW_CHILD_SENTINEL;

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="childMemberId">Enfant</Label>
        <Select
          name="childMemberId"
          value={childMemberId}
          onValueChange={(value) => setChildMemberId(value ?? "")}
          items={childItems}
        >
          <SelectTrigger id="childMemberId" className="w-full">
            <SelectValue placeholder="Choisir un enfant" />
          </SelectTrigger>
          <SelectContent>
            {childItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.childMemberId ? (
          <p className="text-xs text-destructive">{state.fieldErrors.childMemberId}</p>
        ) : null}
      </div>

      {isNewChild ? (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/40 p-4">
          <div className="space-y-2">
            <Label htmlFor="newChildFirstName">Prénom</Label>
            <Input id="newChildFirstName" name="newChildFirstName" required={isNewChild} />
            {state.fieldErrors?.newChildFirstName ? (
              <p className="text-xs text-destructive">{state.fieldErrors.newChildFirstName}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newChildLastName">Nom</Label>
            <Input id="newChildLastName" name="newChildLastName" required={isNewChild} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="newChildBirthDate">Date de naissance (optionnel)</Label>
            <Input id="newChildBirthDate" name="newChildBirthDate" type="date" />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="eventId">Culte / événement (optionnel)</Label>
        <Select name="eventId" defaultValue={NO_EVENT_SENTINEL} items={eventItems}>
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
        <Label htmlFor="guardianName">Parent / tuteur présent</Label>
        <Input id="guardianName" name="guardianName" required />
        {state.fieldErrors?.guardianName ? (
          <p className="text-xs text-destructive">{state.fieldErrors.guardianName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="guardianPhone">Téléphone (optionnel)</Label>
        <Input id="guardianPhone" name="guardianPhone" type="tel" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Allergies / instructions particulières (optionnel)</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le check-in"}
      </Button>
    </form>
  );
}
