"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { CARPOOL_RIDE_STATUSES } from "@/lib/validation/covoiturage";

export interface RideRow {
  id: string;
  departureLabel: string;
  destinationLabel: string;
  departsAt: string;
  status: string;
  seatCapacity: number;
  seatsAvailable: number;
  driverName: string;
  eventTitle: string | null;
}

function statusLabel(status: string) {
  return CARPOOL_RIDE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

const columns: DataTableColumn<RideRow>[] = [
  {
    id: "trajet",
    header: "Trajet",
    cell: (row) => (
      <div>
        <p className="font-medium text-foreground">
          {row.departureLabel} → {row.destinationLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.driverName}
          {row.eventTitle ? ` · ${row.eventTitle}` : ""}
        </p>
      </div>
    ),
  },
  {
    id: "departure",
    header: "Départ",
    cell: (row) => formatDateTime(row.departsAt),
  },
  {
    id: "seats",
    header: "Places",
    cell: (row) => `${row.seatCapacity - row.seatsAvailable}/${row.seatCapacity}`,
  },
  {
    id: "status",
    header: "Statut",
    cell: (row) => <Badge variant="outline">{statusLabel(row.status)}</Badge>,
  },
];

export function RidesList({ rows }: { rows: RideRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/covoiturage/trajets/${row.id}`)}
      searchable={(row, query) =>
        row.departureLabel.toLowerCase().includes(query) ||
        row.destinationLabel.toLowerCase().includes(query) ||
        row.driverName.toLowerCase().includes(query)
      }
      searchPlaceholder="Rechercher un trajet…"
      emptyTitle="Aucun trajet"
      emptyDescription="Aucun trajet de covoiturage n'a encore été proposé."
    />
  );
}
