"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ResourceConflict {
  id: string;
  roomName: string;
  dayLabel: string;
  eventAId: string;
  eventATitle: string;
  eventBId: string;
  eventBTitle: string;
}

export function ConflictsPanel({ conflicts }: { conflicts: ResourceConflict[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = conflicts.filter((c) => !dismissed.has(c.id));

  if (visible.length === 0) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <CheckCircle2Icon className="h-4 w-4 text-success" />
        Aucun conflit de salle détecté cette semaine.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visible.map((conflict) => (
        <div key={conflict.id} className="space-y-2 border-b border-border/60 pb-4 last:border-0 last:pb-0">
          <div className="flex gap-2 text-sm">
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-foreground">
              La salle <span className="font-medium">{conflict.roomName}</span> est réservée deux
              fois {conflict.dayLabel} : <span className="font-medium">{conflict.eventATitle}</span>{" "}
              et <span className="font-medium">{conflict.eventBTitle}</span>. Un des deux doit être
              déplacé.
            </p>
          </div>
          <div className="flex gap-2 pl-6">
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/evenements/${conflict.eventBId}/modifier`} />}
              nativeButton={false}
            >
              Déplacer {conflict.eventBTitle}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed((prev) => new Set(prev).add(conflict.id))}
            >
              Ignorer
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
