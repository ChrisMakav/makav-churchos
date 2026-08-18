"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
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
import { CARPOOL_INCIDENT_TYPES } from "@/lib/validation/covoiturage";
import { reportIncident, type CarpoolFormState } from "../../actions";

export function IncidentForm({
  rides,
  preselectedRideId,
}: {
  rides: { id: string; label: string }[];
  preselectedRideId?: string;
}) {
  const [state, formAction, pending] = useActionState(reportIncident, {} as CarpoolFormState);
  const rideItems = rides.map((r) => ({ value: r.id, label: r.label }));

  if (rides.length === 0) {
    return <p className="text-sm text-muted-foreground">Vous n&apos;êtes associé à aucun trajet pour le moment.</p>;
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="rideId">Trajet concerné</Label>
        <Select
          name="rideId"
          defaultValue={preselectedRideId && rides.some((r) => r.id === preselectedRideId) ? preselectedRideId : rides[0].id}
          items={rideItems}
        >
          <SelectTrigger id="rideId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rideItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="incidentType">Type d&apos;incident</Label>
        <Select name="incidentType" defaultValue="other" items={CARPOOL_INCIDENT_TYPES}>
          <SelectTrigger id="incidentType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARPOOL_INCIDENT_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} required />
        {state.fieldErrors?.description ? (
          <p className="text-xs text-destructive">{state.fieldErrors.description}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le signalement"}
      </Button>
    </form>
  );
}
