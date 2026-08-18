"use client";

import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";

export interface AttendanceRow {
  id: string;
  label: string;
  serviceDate: string;
  womenCount: number;
  menCount: number;
  teensCount: number;
  childrenCount: number;
  totalCount: number;
  newPeopleCount: number;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const columns: DataTableColumn<AttendanceRow>[] = [
  {
    id: "label",
    header: "Culte / rassemblement",
    cell: (row) => <p className="font-medium text-foreground">{row.label}</p>,
  },
  {
    id: "date",
    header: "Date",
    cell: (row) => dateFormatter.format(new Date(`${row.serviceDate}T00:00:00Z`)),
  },
  {
    id: "women",
    header: "Femmes",
    cell: (row) => row.womenCount,
  },
  {
    id: "men",
    header: "Hommes",
    cell: (row) => row.menCount,
  },
  {
    id: "teens",
    header: "Ados",
    cell: (row) => row.teensCount,
  },
  {
    id: "children",
    header: "Enfants",
    cell: (row) => row.childrenCount,
  },
  {
    id: "total",
    header: "Total",
    cell: (row) => <span className="font-medium text-foreground">{row.totalCount}</span>,
  },
  {
    id: "new",
    header: "Nouvelles personnes",
    cell: (row) =>
      row.newPeopleCount > 0 ? (
        <Badge variant="secondary">{row.newPeopleCount}</Badge>
      ) : (
        "—"
      ),
  },
];

export function AttendanceList({ rows }: { rows: AttendanceRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      searchable={(row, query) => row.label.toLowerCase().includes(query)}
      searchPlaceholder="Rechercher un culte…"
      emptyTitle="Aucune statistique"
      emptyDescription="Enregistrez la première statistique de présence de votre église."
    />
  );
}
