"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_EVENT = "__none__";

export function RideSearchForm({ events }: { events: { id: string; title: string }[] }) {
  const searchParams = useSearchParams();
  const eventItems = [{ value: NO_EVENT, label: "Tous les événements" }, ...events.map((e) => ({ value: e.id, label: e.title }))];

  return (
    <form method="get" className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor="event">Événement</Label>
        <Select name="event" defaultValue={searchParams.get("event") || NO_EVENT} items={eventItems}>
          <SelectTrigger id="event" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {eventItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" defaultValue={searchParams.get("date") ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="departure">Départ</Label>
        <Input id="departure" name="departure" defaultValue={searchParams.get("departure") ?? ""} placeholder="Ville, quartier…" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="destination">Destination</Label>
        <Input id="destination" name="destination" defaultValue={searchParams.get("destination") ?? ""} placeholder="Église, salle…" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="seats">Places nécessaires</Label>
        <Input id="seats" name="seats" type="number" min={1} defaultValue={searchParams.get("seats") ?? ""} />
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full">
          Rechercher
        </Button>
      </div>
    </form>
  );
}
