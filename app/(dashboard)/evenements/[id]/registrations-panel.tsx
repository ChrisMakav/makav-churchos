"use client";

import { useState, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRegistrationTrack, deleteRegistrationTrack, updateRegistrationCount } from "../actions";

export interface RegistrationTrackRow {
  id: string;
  label: string;
  capacity: number;
  registeredCount: number;
}

function CountInput({
  organizationId,
  eventId,
  track,
}: {
  organizationId: string;
  eventId: string;
  track: RegistrationTrackRow;
}) {
  const [value, setValue] = useState(String(track.registeredCount));
  const [pending, startTransition] = useTransition();

  const commit = () => {
    if (value === String(track.registeredCount)) return;
    startTransition(() => updateRegistrationCount(organizationId, eventId, track.id, value));
  };

  return (
    <Input
      type="number"
      min={0}
      value={value}
      disabled={pending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      className="w-20 text-right"
    />
  );
}

export function RegistrationsPanel({
  organizationId,
  eventId,
  tracks,
}: {
  organizationId: string;
  eventId: string;
  tracks: RegistrationTrackRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createRegistrationTrack(organizationId, eventId, label, capacity, "0");
        setLabel("");
        setCapacity("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {tracks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune inscription suivie.</p>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => {
            const pct = track.capacity > 0 ? Math.min(100, (track.registeredCount / track.capacity) * 100) : 0;
            return (
              <div key={track.id} className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground">{track.label}</p>
                  <div className="flex items-center gap-2">
                    <CountInput organizationId={organizationId} eventId={eventId} track={track} />
                    <span className="text-sm text-muted-foreground">/ {track.capacity}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      onClick={() =>
                        startTransition(() =>
                          deleteRegistrationTrack(organizationId, eventId, track.id),
                        )
                      }
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(pct, track.registeredCount > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <div className="min-w-40 flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Libellé</label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Portes ouvertes"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Capacité</label>
          <Input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-28"
          />
        </div>
        <Button disabled={!label.trim() || !capacity || pending} onClick={submit}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}
