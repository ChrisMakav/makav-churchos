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
import type { EventFormState } from "./actions";

export interface EventTypeOption {
  id: string;
  label: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface RoomOption {
  id: string;
  name: string;
}

export interface EventFormInitialValues {
  title: string;
  eventTypeId: string;
  description: string;
  location: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
  departmentId: string;
  capacity: string;
}

const EMPTY_VALUES: EventFormInitialValues = {
  title: "",
  eventTypeId: "",
  description: "",
  location: "",
  roomId: "",
  startsAt: "",
  endsAt: "",
  departmentId: "",
  capacity: "",
};

const NO_DEPARTMENT = "__none__";
const NO_ROOM = "__none__";

export function EventForm({
  action,
  eventTypes,
  departments,
  rooms,
  initialValues = EMPTY_VALUES,
  submitLabel,
}: {
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>;
  eventTypes: EventTypeOption[];
  departments: DepartmentOption[];
  rooms: RoomOption[];
  initialValues?: EventFormInitialValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  const eventTypeItems = eventTypes.map((t) => ({ value: t.id, label: t.label }));
  const departmentItems = [
    { value: NO_DEPARTMENT, label: "Aucun" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];
  const roomItems = [
    { value: NO_ROOM, label: "Aucune salle" },
    ...rooms.map((r) => ({ value: r.id, label: r.name })),
  ];

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" defaultValue={initialValues.title} required />
        {state.fieldErrors?.title ? (
          <p className="text-xs text-destructive">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="eventTypeId">Type</Label>
          <Select
            name="eventTypeId"
            defaultValue={initialValues.eventTypeId || undefined}
            items={eventTypeItems}
          >
            <SelectTrigger id="eventTypeId" className="w-full">
              <SelectValue placeholder="Choisir un type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypeItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.eventTypeId ? (
            <p className="text-xs text-destructive">{state.fieldErrors.eventTypeId}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="departmentId">Département</Label>
          <Select
            name="departmentId"
            defaultValue={initialValues.departmentId || NO_DEPARTMENT}
            items={departmentItems}
          >
            <SelectTrigger id="departmentId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departmentItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startsAt">Début</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={initialValues.startsAt}
            required
          />
          {state.fieldErrors?.startsAt ? (
            <p className="text-xs text-destructive">{state.fieldErrors.startsAt}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Fin</Label>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={initialValues.endsAt}
            required
          />
          {state.fieldErrors?.endsAt ? (
            <p className="text-xs text-destructive">{state.fieldErrors.endsAt}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="roomId">Salle</Label>
          <Select
            name="roomId"
            defaultValue={initialValues.roomId || NO_ROOM}
            items={roomItems}
          >
            <SelectTrigger id="roomId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roomItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Lieu (si hors salle)</Label>
          <Input id="location" name="location" defaultValue={initialValues.location} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacité</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={0}
            defaultValue={initialValues.capacity}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialValues.description}
          rows={4}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
