"use client";

import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";

export interface TransactionRow {
  id: string;
  occurredOn: string;
  description: string | null;
  categoryName: string;
  accountName: string;
  type: string;
  amount: number;
  currency: string;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const columns: DataTableColumn<TransactionRow>[] = [
  {
    id: "date",
    header: "Date",
    cell: (row) => dateFormatter.format(new Date(row.occurredOn)),
  },
  {
    id: "description",
    header: "Description",
    cell: (row) => (
      <div>
        <p className="font-medium text-foreground">{row.description || row.categoryName}</p>
        <p className="text-xs text-muted-foreground">
          {row.categoryName} · {row.accountName}
        </p>
      </div>
    ),
  },
  {
    id: "amount",
    header: "Montant",
    className: "text-right",
    cell: (row) => (
      <span className={row.type === "income" ? "text-success" : "text-destructive"}>
        {row.type === "income" ? "+" : "-"}
        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: row.currency }).format(
          row.amount,
        )}
      </span>
    ),
  },
  {
    id: "type",
    header: "",
    cell: (row) => (
      <Badge variant="outline">{row.type === "income" ? "Recette" : "Dépense"}</Badge>
    ),
  },
];

export function TransactionsList({ rows }: { rows: TransactionRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      searchable={(row, query) =>
        (row.description?.toLowerCase().includes(query) ?? false) ||
        row.categoryName.toLowerCase().includes(query)
      }
      searchPlaceholder="Rechercher une transaction…"
      emptyTitle="Aucune transaction"
      emptyDescription="Les recettes et dépenses postées apparaîtront ici."
    />
  );
}
