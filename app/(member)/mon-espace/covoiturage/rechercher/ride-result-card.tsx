"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import { requestSeat, type CarpoolFormState } from "../actions";

export interface RideResult {
  id: string;
  driverName: string;
  departureLabel: string;
  destinationLabel: string;
  departsAt: string;
  seatsAvailable: number;
  seatCapacity: number;
  eventTitle: string | null;
  vehicleLabel: string | null;
  stops: string[];
  acceptsChildren: boolean;
  acceptsLuggage: boolean;
  acceptsPets: boolean;
  nonSmoking: boolean;
  hasAirConditioning: boolean;
  isPmrAccessible: boolean;
}

function RequestSeatDialog({ ride }: { ride: RideResult }) {
  const [state, formAction, pending] = useActionState(requestSeat, {} as CarpoolFormState);

  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" />}>Demander une place</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ride.departureLabel} → {ride.destinationLabel}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="rideId" value={ride.id} />
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={`seatsRequested-${ride.id}`}>Nombre de places</Label>
            <Input
              id={`seatsRequested-${ride.id}`}
              name="seatsRequested"
              type="number"
              min={1}
              max={ride.seatsAvailable}
              defaultValue={1}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`message-${ride.id}`}>Message pour le conducteur (optionnel)</Label>
            <Textarea id={`message-${ride.id}`} name="message" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RideResultCard({ ride }: { ride: RideResult }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">
              {ride.departureLabel} → {ride.destinationLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              {ride.driverName} · {formatDateTime(ride.departsAt)}
            </p>
            {ride.eventTitle ? <p className="text-xs text-muted-foreground">{ride.eventTitle}</p> : null}
            {ride.vehicleLabel ? <p className="text-xs text-muted-foreground">{ride.vehicleLabel}</p> : null}
          </div>
          <Badge variant="outline">
            {ride.seatsAvailable}/{ride.seatCapacity} places
          </Badge>
        </div>

        {ride.stops.length > 0 ? (
          <p className="text-xs text-muted-foreground">Arrêts : {ride.stops.join(" · ")}</p>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {ride.acceptsChildren ? <Badge variant="secondary">Enfants OK</Badge> : null}
          {ride.acceptsLuggage ? <Badge variant="secondary">Bagages OK</Badge> : null}
          {ride.acceptsPets ? <Badge variant="secondary">Animaux OK</Badge> : null}
          {ride.nonSmoking ? <Badge variant="secondary">Non-fumeur</Badge> : null}
          {ride.hasAirConditioning ? <Badge variant="secondary">Climatisation</Badge> : null}
          {ride.isPmrAccessible ? <Badge variant="secondary">PMR</Badge> : null}
        </div>

        <RequestSeatDialog ride={ride} />
      </CardContent>
    </Card>
  );
}
