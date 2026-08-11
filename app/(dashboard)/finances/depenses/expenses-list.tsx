"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";
import { EXPENSE_STATUS_OPTIONS } from "@/lib/validation/finance";

export interface ExpenseRow {
  id: string;
  vendor: string | null;
  categoryName: string;
  amount: number;
  currency: string;
  status: string;
}

const STATUS_LABEL = Object.fromEntries(EXPENSE_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending_approval: "outline",
  approved: "default",
  paid: "secondary",
  rejected: "destructive",
};

const columns: DataTableColumn<ExpenseRow>[] = [
  {
    id: "vendor",
    header: "Dépense",
    cell: (row) => (
      <div>
        <p className="font-medium text-foreground">{row.vendor || row.categoryName}</p>
        <p className="text-xs text-muted-foreground">{row.categoryName}</p>
      </div>
    ),
  },
  {
    id: "amount",
    header: "Montant",
    cell: (row) =>
      new Intl.NumberFormat("fr-FR", { style: "currency", currency: row.currency }).format(
        row.amount,
      ),
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

export function ExpensesList({ rows }: { rows: ExpenseRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/finances/depenses/${row.id}`)}
      searchable={(row, query) =>
        (row.vendor?.toLowerCase().includes(query) ?? false) ||
        row.categoryName.toLowerCase().includes(query)
      }
      searchPlaceholder="Rechercher une dépense…"
      emptyTitle="Aucune dépense"
      emptyDescription="Enregistrez votre première demande de dépense."
    />
  );
}
