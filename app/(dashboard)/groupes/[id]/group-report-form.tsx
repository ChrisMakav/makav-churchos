"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { GroupReportFormState } from "../actions";

export function GroupReportForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (state: GroupReportFormState, formData: FormData) => Promise<GroupReportFormState>;
  initialValues?: {
    meetingDate: string;
    theme: string;
    womenCount: string;
    menCount: string;
    teensCount: string;
    childrenCount: string;
    newPeopleCount: string;
    newBirthsCount: string;
    notes: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [womenCount, setWomenCount] = useState(initialValues?.womenCount ?? "0");
  const [menCount, setMenCount] = useState(initialValues?.menCount ?? "0");
  const [teensCount, setTeensCount] = useState(initialValues?.teensCount ?? "0");
  const [childrenCount, setChildrenCount] = useState(initialValues?.childrenCount ?? "0");

  const total = useMemo(() => {
    return [womenCount, menCount, teensCount, childrenCount]
      .map((v) => Number(v))
      .reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
  }, [womenCount, menCount, teensCount, childrenCount]);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="meetingDate">Date de la rencontre</Label>
        <Input
          id="meetingDate"
          name="meetingDate"
          type="date"
          defaultValue={initialValues?.meetingDate ?? new Date().toISOString().slice(0, 10)}
          required
        />
        {state.fieldErrors?.meetingDate ? (
          <p className="text-xs text-destructive">{state.fieldErrors.meetingDate}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Thème abordé</Label>
        <Input
          id="theme"
          name="theme"
          defaultValue={initialValues?.theme}
          placeholder="Ex. La prière selon Matthieu 6"
          required
        />
        {state.fieldErrors?.theme ? (
          <p className="text-xs text-destructive">{state.fieldErrors.theme}</p>
        ) : null}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="newPeopleCount">Nouvelles personnes</Label>
          <Input
            id="newPeopleCount"
            name="newPeopleCount"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.newPeopleCount ?? "0"}
          />
          {state.fieldErrors?.newPeopleCount ? (
            <p className="text-xs text-destructive">{state.fieldErrors.newPeopleCount}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="newBirthsCount">Nouvelles naissances</Label>
          <Input
            id="newBirthsCount"
            name="newBirthsCount"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.newBirthsCount ?? "0"}
          />
          {state.fieldErrors?.newBirthsCount ? (
            <p className="text-xs text-destructive">{state.fieldErrors.newBirthsCount}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initialValues?.notes}
          rows={4}
          placeholder="Besoins exprimés, prochaines étapes, autres observations…"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
