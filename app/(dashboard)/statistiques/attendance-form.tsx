"use client";

import { useActionState, useMemo, useState } from "react";
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
import { NO_EVENT_SENTINEL } from "@/lib/validation/attendance";
import type { AttendanceFormState } from "./actions";

export interface EventOption {
  id: string;
  title: string;
}

export function AttendanceForm({
  action,
  events,
}: {
  action: (state: AttendanceFormState, formData: FormData) => Promise<AttendanceFormState>;
  events: EventOption[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [womenCount, setWomenCount] = useState("0");
  const [menCount, setMenCount] = useState("0");
  const [teensCount, setTeensCount] = useState("0");
  const [childrenCount, setChildrenCount] = useState("0");

  const eventItems = [
    { value: NO_EVENT_SENTINEL, label: "Aucun" },
    ...events.map((e) => ({ value: e.id, label: e.title })),
  ];

  const total = useMemo(() => {
    const sum = [womenCount, menCount, teensCount, childrenCount]
      .map((v) => Number(v))
      .reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
    return sum;
  }, [womenCount, menCount, teensCount, childrenCount]);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="label">Libellé</Label>
        <Input
          id="label"
          name="label"
          placeholder="Culte du dimanche matin"
          required
        />
        {state.fieldErrors?.label ? (
          <p className="text-xs text-destructive">{state.fieldErrors.label}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="serviceDate">Date</Label>
        <Input
          id="serviceDate"
          name="serviceDate"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
        {state.fieldErrors?.serviceDate ? (
          <p className="text-xs text-destructive">{state.fieldErrors.serviceDate}</p>
        ) : null}
      </div>

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="womenCount">Femmes</Label>
          <Input
            id="womenCount"
            name="womenCount"
            type="number"
            min="0"
            step="1"
            value={womenCount}
            onChange={(e) => setWomenCount(e.target.value)}
          />
          {state.fieldErrors?.womenCount ? (
            <p className="text-xs text-destructive">{state.fieldErrors.womenCount}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="menCount">Hommes</Label>
          <Input
            id="menCount"
            name="menCount"
            type="number"
            min="0"
            step="1"
            value={menCount}
            onChange={(e) => setMenCount(e.target.value)}
          />
          {state.fieldErrors?.menCount ? (
            <p className="text-xs text-destructive">{state.fieldErrors.menCount}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="teensCount">Ados</Label>
          <Input
            id="teensCount"
            name="teensCount"
            type="number"
            min="0"
            step="1"
            value={teensCount}
            onChange={(e) => setTeensCount(e.target.value)}
          />
          {state.fieldErrors?.teensCount ? (
            <p className="text-xs text-destructive">{state.fieldErrors.teensCount}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="childrenCount">Enfants</Label>
          <Input
            id="childrenCount"
            name="childrenCount"
            type="number"
            min="0"
            step="1"
            value={childrenCount}
            onChange={(e) => setChildrenCount(e.target.value)}
          />
          {state.fieldErrors?.childrenCount ? (
            <p className="text-xs text-destructive">{state.fieldErrors.childrenCount}</p>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Total participants : <span className="font-medium text-foreground">{total}</span>
      </p>

      <div className="space-y-2">
        <Label htmlFor="newPeopleCount">Nouvelles personnes</Label>
        <Input id="newPeopleCount" name="newPeopleCount" type="number" min="0" step="1" defaultValue="0" />
        {state.fieldErrors?.newPeopleCount ? (
          <p className="text-xs text-destructive">{state.fieldErrors.newPeopleCount}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer la statistique"}
      </Button>
    </form>
  );
}
