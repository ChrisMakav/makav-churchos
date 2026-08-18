"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, toUtcTimeLabel } from "@/lib/format";
import {
  completeAppointmentSlot,
  confirmAppointmentSlot,
  deleteAppointmentSlot,
  releaseAppointmentSlot,
} from "./actions";

export interface AppointmentSlotRow {
  id: string;
  pastorName: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  status: "open" | "requested" | "confirmed" | "completed";
  reason: string | null;
  memberName: string | null;
}

const STATUS_LABEL: Record<AppointmentSlotRow["status"], string> = {
  open: "Disponible",
  requested: "Demande en attente",
  confirmed: "Confirmé",
  completed: "Terminé",
};

const STATUS_VARIANT: Record<AppointmentSlotRow["status"], "default" | "secondary" | "outline"> = {
  open: "outline",
  requested: "default",
  confirmed: "secondary",
  completed: "outline",
};

function formatRange(startsAt: string, endsAt: string) {
  return `${formatDateTime(startsAt)} – ${toUtcTimeLabel(endsAt)}`;
}

function SlotRow({ slot, organizationId }: { slot: AppointmentSlotRow; organizationId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{formatRange(slot.startsAt, slot.endsAt)}</p>
        <p className="text-xs text-muted-foreground">
          {slot.pastorName}
          {slot.location ? ` · ${slot.location}` : ""}
          {slot.memberName ? ` · ${slot.memberName}` : ""}
        </p>
        {slot.reason ? <p className="mt-1 text-xs text-muted-foreground">« {slot.reason} »</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANT[slot.status]}>{STATUS_LABEL[slot.status]}</Badge>
        {slot.status === "requested" ? (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => confirmAppointmentSlot(organizationId, slot.id))}
            >
              Confirmer
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => releaseAppointmentSlot(organizationId, slot.id))}
            >
              Refuser
            </Button>
          </>
        ) : null}
        {slot.status === "confirmed" ? (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => completeAppointmentSlot(organizationId, slot.id))}
            >
              Marquer terminé
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => releaseAppointmentSlot(organizationId, slot.id))}
            >
              Annuler
            </Button>
          </>
        ) : null}
        {slot.status === "open" ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => deleteAppointmentSlot(organizationId, slot.id))}
          >
            Supprimer
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function AppointmentSlotsList({
  organizationId,
  rows,
}: {
  organizationId: string;
  rows: AppointmentSlotRow[];
}) {
  const requested = rows.filter((r) => r.status === "requested");
  const confirmed = rows.filter((r) => r.status === "confirmed");
  const open = rows.filter((r) => r.status === "open");
  const completed = rows.filter((r) => r.status === "completed").slice(-20).reverse();

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun créneau. Créez votre premier créneau pour permettre aux membres de prendre rendez-vous.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {requested.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-heading text-lg text-foreground">
            Demandes en attente ({requested.length})
          </h2>
          <div className="space-y-2">
            {requested.map((slot) => (
              <SlotRow key={slot.id} slot={slot} organizationId={organizationId} />
            ))}
          </div>
        </div>
      ) : null}

      {confirmed.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-heading text-lg text-foreground">Confirmés ({confirmed.length})</h2>
          <div className="space-y-2">
            {confirmed.map((slot) => (
              <SlotRow key={slot.id} slot={slot} organizationId={organizationId} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="font-heading text-lg text-foreground">Créneaux disponibles ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun créneau disponible pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {open.map((slot) => (
              <SlotRow key={slot.id} slot={slot} organizationId={organizationId} />
            ))}
          </div>
        )}
      </div>

      {completed.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-heading text-lg text-foreground">Historique récent</h2>
          <div className="space-y-2">
            {completed.map((slot) => (
              <SlotRow key={slot.id} slot={slot} organizationId={organizationId} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
