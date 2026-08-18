"use client";

import { useActionState } from "react";
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
import { MEETING_DAY_OPTIONS } from "@/lib/validation/groups";
import type { GroupFormState } from "./actions";

const NO_DAY = "__none__";

const DAY_ITEMS = [{ value: NO_DAY, label: "Non défini" }, ...MEETING_DAY_OPTIONS];

export function GroupForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (state: GroupFormState, formData: FormData) => Promise<GroupFormState>;
  initialValues?: {
    name: string;
    description: string;
    meetingDay: string;
    meetingTime: string;
    location: string;
    capacity: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialValues?.name}
          placeholder="Cellule Bastos"
          required
        />
        {state.fieldErrors?.name ? (
          <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meetingDay">Jour de rencontre</Label>
          <Select name="meetingDay" defaultValue={initialValues?.meetingDay || NO_DAY} items={DAY_ITEMS}>
            <SelectTrigger id="meetingDay" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_ITEMS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="meetingTime">Heure</Label>
          <Input
            id="meetingTime"
            name="meetingTime"
            type="time"
            defaultValue={initialValues?.meetingTime}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Lieu</Label>
          <Input
            id="location"
            name="location"
            defaultValue={initialValues?.location}
            placeholder="Domicile du responsable"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacité</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="0"
            defaultValue={initialValues?.capacity}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
