"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";
import { MEMBER_STATUS_OPTIONS } from "@/lib/validation/members";

export interface MemberRow {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  familyName: string | null;
}

const STATUS_LABEL = Object.fromEntries(
  MEMBER_STATUS_OPTIONS.map((o) => [o.value, o.label]),
) as Record<string, string>;

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  visitor: "outline",
  inactive: "secondary",
  transferred: "secondary",
  deceased: "destructive",
};

const columns: DataTableColumn<MemberRow>[] = [
  {
    id: "name",
    header: "Membre",
    cell: (row) => (
      <div>
        <p className="font-medium text-foreground">{row.fullName}</p>
        <p className="text-xs text-muted-foreground">{row.email ?? row.phone ?? "—"}</p>
      </div>
    ),
  },
  {
    id: "family",
    header: "Famille",
    cell: (row) => row.familyName ?? "—",
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

export function MembersList({ rows }: { rows: MemberRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/membres/${row.id}`)}
      searchable={(row, query) =>
        row.fullName.toLowerCase().includes(query) ||
        (row.email?.toLowerCase().includes(query) ?? false) ||
        (row.phone?.toLowerCase().includes(query) ?? false)
      }
      searchPlaceholder="Rechercher un membre…"
      emptyTitle="Aucun membre"
      emptyDescription="Ajoutez votre premier membre pour commencer."
    />
  );
}
