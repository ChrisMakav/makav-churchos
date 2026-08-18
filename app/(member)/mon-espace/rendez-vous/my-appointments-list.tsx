"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, toUtcTimeLabel } from "@/lib/format";
import { cancelMyAppointment } from "./actions";

export interface MyAppointmentRow {
  id: string;
  pastorName: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  status: "requested" | "confirmed" | "completed";
  reason: string | null;
}

const STATUS_LABEL: Record<MyAppointmentRow["status"], string> = {
  requested: "En attente de confirmation",
  confirmed: "Confirmé",
  completed: "Terminé",
};

const STATUS_VARIANT: Record<MyAppointmentRow["status"], "default" | "secondary" | "outline"> = {
  requested: "default",
  confirmed: "secondary",
  completed: "outline",
};

function AppointmentRow({ appointment }: { appointment: MyAppointmentRow }) {
  const [pending, startTransition] = useTransition();
  const canCancel = appointment.status === "requested" || appointment.status === "confirmed";

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          {formatDateTime(appointment.startsAt)} – {toUtcTimeLabel(appointment.endsAt)}
        </p>
        <p className="text-xs text-muted-foreground">
          {appointment.pastorName}
          {appointment.location ? ` · ${appointment.location}` : ""}
        </p>
        {appointment.reason ? (
          <p className="mt-1 text-xs text-muted-foreground">« {appointment.reason} »</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANT[appointment.status]}>{STATUS_LABEL[appointment.status]}</Badge>
        {canCancel ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => cancelMyAppointment(appointment.id))}
          >
            Annuler
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function MyAppointmentsList({ appointments }: { appointments: MyAppointmentRow[] }) {
  if (appointments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Vous n&apos;avez aucun rendez-vous pour le moment.</p>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((a) => (
        <AppointmentRow key={a.id} appointment={a} />
      ))}
    </div>
  );
}
