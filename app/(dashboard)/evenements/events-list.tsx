"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";
import { EventTypeBadge } from "@/components/patterns/event-type-badge";
import { EVENT_STATUS_OPTIONS } from "@/lib/validation/events";

export interface EventRow {
  id: string;
  title: string;
  typeLabel: string;
  typeColor: string;
  startsAt: string;
  location: string | null;
  status: string;
}

const STATUS_LABEL = Object.fromEntries(EVENT_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
};

// timeZone: "UTC" — voir la note dans lib/format.ts sur la convention
// heure saisie = heure stockée = heure affichée en P1.
const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const columns: DataTableColumn<EventRow>[] = [
  {
    id: "title",
    header: "Événement",
    cell: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-foreground">{row.title}</p>
        <EventTypeBadge label={row.typeLabel} color={row.typeColor} />
      </div>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: (row) => dateFormatter.format(new Date(row.startsAt)),
  },
  {
    id: "location",
    header: "Lieu",
    cell: (row) => row.location ?? "—",
  },
  {
    id: "status",
    header: "Statut",
    cell: (row) => (
      <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
        {STATUS_LABEL[row.status] ?? row.status}
      </Badge>
    ),
  },
];

export function EventsList({ rows }: { rows: EventRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/evenements/${row.id}`)}
      searchable={(row, query) => row.title.toLowerCase().includes(query)}
      searchPlaceholder="Rechercher un événement…"
      emptyTitle="Aucun événement"
      emptyDescription="Planifiez votre premier culte ou réunion."
    />
  );
}
