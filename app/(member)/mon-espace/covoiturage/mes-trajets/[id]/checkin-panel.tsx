"use client";

import { useTransition } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RideRequestRow } from "./ride-requests-panel";
import { markCheckin } from "../../actions";

function CheckinRow({ request }: { request: RideRequestRow }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2">
      <p className="text-sm text-foreground">{request.passengerName}</p>
      <div className="flex items-center gap-2">
        {request.checkedInAt ? (
          <Badge variant="outline">Embarqué(e)</Badge>
        ) : request.noShow ? (
          <Badge variant="destructive">Absent(e)</Badge>
        ) : (
          <>
            <Button
              size="icon-sm"
              variant="outline"
              disabled={pending}
              onClick={() => startTransition(() => markCheckin(request.id, true, false))}
              title="Embarqué(e)"
            >
              <CheckIcon className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={pending}
              onClick={() => startTransition(() => markCheckin(request.id, false, true))}
              title="Absent(e)"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function CheckinPanel({ requests }: { requests: RideRequestRow[] }) {
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun passager confirmé pour ce trajet.</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <CheckinRow key={r.id} request={r} />
      ))}
    </div>
  );
}
