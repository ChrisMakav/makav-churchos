"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { toUtcDayKey, toUtcTimeLabel } from "@/lib/format";

export interface OpenSlot {
  id: string;
  pastorName: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
}

// Les créneaux sont saisis/stockés comme des dates "naïves" affichées telle
// quelle en UTC (voir lib/format.ts). react-day-picker compare et affiche ses
// dates dans le fuseau LOCAL du navigateur — construire ces dates avec
// `new Date(iso)` puis lire ses getters locaux décalerait le jour affiché
// selon le décalage UTC du visiteur. `new Date("yyyy-MM-ddT00:00:00")` (sans
// suffixe "Z"/offset) est en revanche interprété comme minuit LOCAL par le
// moteur JS — mêmes chiffres J/M/A que la clé UTC, aucune conversion de
// fuseau, exactement ce qu'il faut pour comparer avec les cellules du
// calendrier (elles aussi en local).

function localDayKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function AppointmentCalendar({ slots }: { slots: OpenSlot[] }) {
  const slotsByDay = useMemo(() => {
    const map = new Map<string, OpenSlot[]>();
    for (const slot of slots) {
      const key = toUtcDayKey(slot.startsAt);
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return map;
  }, [slots]);

  const availableDates = useMemo(
    () => Array.from(slotsByDay.keys()).map((key) => new Date(`${key}T00:00:00`)),
    [slotsByDay],
  );

  const firstAvailable = availableDates[0];

  const [selected, setSelected] = useState<Date | undefined>(firstAvailable);

  const selectedKey = selected ? localDayKey(selected) : null;
  const daySlots = (selectedKey ? slotsByDay.get(selectedKey) : undefined) ?? [];

  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun créneau disponible pour le moment.</p>;
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        defaultMonth={firstAvailable}
        modifiers={{ available: availableDates }}
        modifiersClassNames={{ available: "font-semibold text-primary" }}
        disabled={(date) => !slotsByDay.has(localDayKey(date))}
        locale={fr}
        className="rounded-xl border border-border"
      />

      <div className="flex-1 space-y-2">
        {!selected ? (
          <p className="text-sm text-muted-foreground">Choisissez une date disponible dans le calendrier.</p>
        ) : daySlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun créneau ce jour-là.</p>
        ) : (
          daySlots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {toUtcTimeLabel(slot.startsAt)} – {toUtcTimeLabel(slot.endsAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {slot.pastorName}
                  {slot.location ? ` · ${slot.location}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                render={<Link href={`/mon-espace/rendez-vous/${slot.id}/demander`} />}
                nativeButton={false}
              >
                Demander
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
