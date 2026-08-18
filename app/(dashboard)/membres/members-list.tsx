"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";
import { MEMBER_STATUS_OPTIONS } from "@/lib/validation/members";
import { useTranslations } from "@/lib/i18n/context";

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

export function MembersList({ rows }: { rows: MemberRow[] }) {
  const router = useRouter();
  const { t } = useTranslations();

  const columns: DataTableColumn<MemberRow>[] = [
    {
      id: "name",
      header: t("membres.columnMember"),
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.fullName}</p>
          <p className="text-xs text-muted-foreground">{row.email ?? row.phone ?? "—"}</p>
        </div>
      ),
    },
    {
      id: "family",
      header: t("membres.columnFamily"),
      cell: (row) => row.familyName ?? "—",
    },
    {
      id: "status",
      header: t("membres.columnStatus"),
      cell: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
          {STATUS_LABEL[row.status] ?? row.status}
        </Badge>
      ),
    },
  ];

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
      searchPlaceholder={t("membres.searchPlaceholder")}
      emptyTitle={t("membres.emptyTitle")}
      emptyDescription={t("membres.emptyDescription")}
    />
  );
}
