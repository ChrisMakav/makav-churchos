"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CARPOOL_REQUEST_STATUSES } from "@/lib/validation/covoiturage";
import { respondToRequest } from "../../actions";

export interface RideRequestRow {
  id: string;
  passengerName: string;
  seatsRequested: number;
  status: string;
  message: string | null;
  checkedInAt: string | null;
  noShow: boolean;
}

function RequestRow({ request }: { request: RideRequestRow }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {request.passengerName} · {request.seatsRequested} place{request.seatsRequested > 1 ? "s" : ""}
          </p>
          {request.message ? <p className="text-xs text-muted-foreground">{request.message}</p> : null}
        </div>
        <Badge variant="outline">
          {CARPOOL_REQUEST_STATUSES.find((s) => s.value === request.status)?.label ?? request.status}
        </Badge>
      </div>
      {request.status === "pending" ? (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => respondToRequest(request.id, true))}
          >
            Confirmer
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => respondToRequest(request.id, false))}
          >
            Refuser
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function RideRequestsPanel({ requests }: { requests: RideRequestRow[] }) {
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune demande pour ce trajet.</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <RequestRow key={r.id} request={r} />
      ))}
    </div>
  );
}
