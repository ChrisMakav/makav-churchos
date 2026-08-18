"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";

export interface DonationRow {
  id: string;
  donorName: string;
  fundName: string;
  amount: number;
  currency: string;
  givenAt: string;
  receiptNumber: string | null;
  isRecurring: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const columns: DataTableColumn<DonationRow>[] = [
  {
    id: "donor",
    header: "Donateur",
    cell: (row) => (
      <div>
        <p className="font-medium text-foreground">
          {row.donorName}
          {row.isRecurring ? (
            <Badge variant="secondary" className="ml-2">
              Récurrent
            </Badge>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">{row.fundName}</p>
      </div>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: (row) => dateFormatter.format(new Date(row.givenAt)),
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
    id: "receipt",
    header: "Reçu",
    cell: (row) =>
      row.receiptNumber ? <Badge variant="outline">{row.receiptNumber}</Badge> : "—",
  },
];

export function DonationsList({ rows }: { rows: DonationRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/dons/${row.id}`)}
      searchable={(row, query) =>
        row.donorName.toLowerCase().includes(query) || row.fundName.toLowerCase().includes(query)
      }
      searchPlaceholder="Rechercher un don…"
      emptyTitle="Aucun don"
      emptyDescription="Enregistrez le premier don reçu par votre église."
    />
  );
}
