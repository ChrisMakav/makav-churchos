"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";
import { PASTORAL_CATEGORY_OPTIONS, PASTORAL_STATUS_OPTIONS } from "@/lib/validation/pastoral-care";

export interface PastoralRecordRow {
  id: string;
  memberName: string;
  category: string;
  notesExcerpt: string;
  status: string;
  followUpDate: string | null;
  createdAt: string;
}

const CATEGORY_LABEL = Object.fromEntries(PASTORAL_CATEGORY_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_LABEL = Object.fromEntries(PASTORAL_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  open: "default",
  in_progress: "secondary",
  closed: "outline",
};

const columns: DataTableColumn<PastoralRecordRow>[] = [
  {
    id: "member",
    header: "Membre",
    cell: (row) => (
      <div>
        <p className="font-medium text-foreground">{row.memberName}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{row.notesExcerpt}</p>
      </div>
    ),
  },
  {
    id: "category",
    header: "Catégorie",
    cell: (row) => CATEGORY_LABEL[row.category] ?? row.category,
  },
  {
    id: "followUp",
    header: "Relance",
    cell: (row) =>
      row.followUpDate
        ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(
            new Date(row.followUpDate),
          )
        : "—",
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

export function PastoralRecordsList({ rows }: { rows: PastoralRecordRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/suivi-pastoral/${row.id}`)}
      searchable={(row, query) =>
        row.memberName.toLowerCase().includes(query) ||
        row.notesExcerpt.toLowerCase().includes(query)
      }
      searchPlaceholder="Rechercher un membre ou une note…"
      emptyTitle="Aucun suivi pastoral"
      emptyDescription="Enregistrez votre première visite, appel ou demande de prière."
    />
  );
}
