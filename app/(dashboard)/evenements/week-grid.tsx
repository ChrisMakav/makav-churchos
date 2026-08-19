"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toUtcTimeLabel } from "@/lib/format";
import { moveEvent } from "./actions";

interface GridEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  color: string;
  rowKey: string;
  dayKey: string;
}

interface GridRow {
  key: string;
  label: string;
  capacity: number | null;
}

interface GridDay {
  key: string;
  label: string;
  dayNumber: string;
  isToday: boolean;
}

// Grille salle × jour glisser-déposer : déplace un événement change son jour
// et/ou sa salle en un seul geste (moveEvent conserve heure + durée
// d'origine). Position optimiste tenue en state local, revert si le serveur
// refuse (permission, conflit RLS...) — voir actions.ts::moveEvent.
export function WeekGrid({
  organizationId,
  rows,
  days,
  events,
  canEdit,
}: {
  organizationId: string;
  rows: GridRow[];
  days: GridDay[];
  events: GridEvent[];
  canEdit: boolean;
}) {
  const [positions, setPositions] = useState<Record<string, { rowKey: string; dayKey: string }>>(
    () => Object.fromEntries(events.map((e) => [e.id, { rowKey: e.rowKey, dayKey: e.dayKey }])),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const draggingId = useRef<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const eventsByCell = new Map<string, GridEvent[]>();
  for (const event of events) {
    const pos = positions[event.id] ?? { rowKey: event.rowKey, dayKey: event.dayKey };
    const cellKey = `${pos.rowKey}::${pos.dayKey}`;
    if (!eventsByCell.has(cellKey)) eventsByCell.set(cellKey, []);
    eventsByCell.get(cellKey)!.push(event);
  }

  function handleDrop(rowKey: string, dayKey: string) {
    const eventId = draggingId.current;
    draggingId.current = null;
    setDragOverCell(null);
    if (!eventId) return;

    const previous = positions[eventId];
    if (!previous || (previous.rowKey === rowKey && previous.dayKey === dayKey)) return;

    setPositions((p) => ({ ...p, [eventId]: { rowKey, dayKey } }));
    setError(null);
    startTransition(async () => {
      const result = await moveEvent(organizationId, eventId, rowKey, dayKey);
      if (result.error) {
        setPositions((p) => ({ ...p, [eventId]: previous }));
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="min-w-[900px]">
          <div
            className="grid border-b border-border bg-muted/40"
            style={{ gridTemplateColumns: "160px repeat(7, minmax(0, 1fr))" }}
          >
            <div className="px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Salle</div>
            {days.map((day) => (
              <div
                key={day.key}
                className="border-l border-border px-3 py-2 text-xs font-medium uppercase text-muted-foreground"
              >
                {day.label} <span className={day.isToday ? "text-primary" : undefined}>{day.dayNumber}</span>
              </div>
            ))}
          </div>

          {rows.map((row) => (
            <div
              key={row.key}
              className="grid border-b border-border last:border-b-0"
              style={{ gridTemplateColumns: "160px repeat(7, minmax(0, 1fr))" }}
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{row.label}</p>
                {row.capacity != null ? (
                  <p className="text-xs text-muted-foreground">Capacité {row.capacity}</p>
                ) : null}
              </div>
              {days.map((day) => {
                const cellKey = `${row.key}::${day.key}`;
                const cellEvents = eventsByCell.get(cellKey) ?? [];
                const isOver = dragOverCell === cellKey;
                return (
                  <div
                    key={day.key}
                    className={`min-h-20 space-y-1 border-l border-border p-1.5 transition-colors ${isOver ? "bg-primary/10" : ""}`}
                    onDragOver={
                      canEdit
                        ? (e) => {
                            e.preventDefault();
                            if (dragOverCell !== cellKey) setDragOverCell(cellKey);
                          }
                        : undefined
                    }
                    onDragLeave={
                      canEdit ? () => setDragOverCell((c) => (c === cellKey ? null : c)) : undefined
                    }
                    onDrop={
                      canEdit
                        ? (e) => {
                            e.preventDefault();
                            handleDrop(row.key, day.key);
                          }
                        : undefined
                    }
                  >
                    {cellEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/evenements/${event.id}`}
                        draggable={canEdit}
                        onDragStart={
                          canEdit
                            ? (e) => {
                                draggingId.current = event.id;
                                e.dataTransfer.effectAllowed = "move";
                              }
                            : undefined
                        }
                        onDragEnd={() => {
                          draggingId.current = null;
                          setDragOverCell(null);
                        }}
                        className={`block rounded-md border-l-[3px] px-2 py-1 text-left ${canEdit ? "cursor-grab active:cursor-grabbing" : ""}`}
                        style={{ borderLeftColor: event.color, backgroundColor: `${event.color}1f` }}
                      >
                        <p className="text-[11px] text-muted-foreground">
                          {toUtcTimeLabel(event.startsAt)} – {toUtcTimeLabel(event.endsAt)}
                        </p>
                        <p className="truncate text-xs font-medium text-foreground">{event.title}</p>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
