"use client";

import { useTransition } from "react";
import Link from "next/link";
import { TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toUtcTimeLabel } from "@/lib/format";
import { checkOutChild } from "./actions";

export interface CheckinSessionRow {
  id: string;
  childName: string;
  guardianName: string;
  guardianPhone: string | null;
  securityCode: string;
  eventTitle: string | null;
  checkedInAt: string;
  checkedOutAt: string | null;
}

function SessionRow({
  session,
  organizationId,
}: {
  session: CheckinSessionRow;
  organizationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const isActive = !session.checkedOutAt;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={
            isActive
              ? "flex h-10 w-14 items-center justify-center rounded-lg bg-primary font-heading text-lg text-primary-foreground"
              : "flex h-10 w-14 items-center justify-center rounded-lg bg-muted font-heading text-lg text-muted-foreground"
          }
        >
          {session.securityCode}
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{session.childName}</p>
          <p className="text-xs text-muted-foreground">
            {session.guardianName}
            {session.guardianPhone ? ` · ${session.guardianPhone}` : ""}
            {session.eventTitle ? ` · ${session.eventTitle}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right text-xs text-muted-foreground">
          <p>Arrivée : {toUtcTimeLabel(session.checkedInAt)}</p>
          {session.checkedOutAt ? <p>Départ : {toUtcTimeLabel(session.checkedOutAt)}</p> : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/checkin/${session.id}/etiquette`} target="_blank" />}
          nativeButton={false}
        >
          <TagIcon className="h-4 w-4" />
        </Button>
        {isActive ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => checkOutChild(organizationId, session.id))}
          >
            Terminer
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function CheckinSessionsList({
  organizationId,
  active,
  history,
}: {
  organizationId: string;
  active: CheckinSessionRow[];
  history: CheckinSessionRow[];
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-heading text-lg text-foreground">Présents ({active.length})</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun enfant présent pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {active.map((session) => (
              <SessionRow key={session.id} session={session} organizationId={organizationId} />
            ))}
          </div>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-heading text-lg text-foreground">Historique récent</h2>
          <div className="space-y-2">
            {history.map((session) => (
              <SessionRow key={session.id} session={session} organizationId={organizationId} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
