"use client";

import { useState, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toUtcTimeLabel, toDatetimeLocalValue } from "@/lib/format";
import { createServiceItem, deleteServiceItem } from "../actions";

export interface ServiceItemRow {
  id: string;
  startsAt: string;
  title: string;
  ownerName: string | null;
}

export function ServiceItemsPanel({
  organizationId,
  eventId,
  eventStartsAt,
  items,
}: {
  organizationId: string;
  eventId: string;
  eventStartsAt: string;
  items: ServiceItemRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [startsAt, setStartsAt] = useState(toDatetimeLocalValue(eventStartsAt));
  const [title, setTitle] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createServiceItem(organizationId, eventId, startsAt, title, ownerName);
        setTitle("");
        setOwnerName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun élément de déroulé.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5"
            >
              <div className="flex gap-3">
                <span className="w-14 shrink-0 text-sm font-medium text-foreground">
                  {toUtcTimeLabel(item.startsAt)}
                </span>
                <div>
                  <p className="text-sm text-foreground">{item.title}</p>
                  {item.ownerName ? (
                    <p className="text-xs text-muted-foreground">{item.ownerName}</p>
                  ) : null}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                onClick={() =>
                  startTransition(() => deleteServiceItem(organizationId, eventId, item.id))
                }
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Heure</label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="min-w-40 flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Titre</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Accueil & annonces"
          />
        </div>
        <div className="min-w-36 space-y-1.5">
          <label className="text-xs text-muted-foreground">Responsable</label>
          <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </div>
        <Button disabled={!title.trim() || !startsAt || pending} onClick={submit}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}
