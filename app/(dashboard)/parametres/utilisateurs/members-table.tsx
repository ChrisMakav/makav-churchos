"use client";

import { useTransition } from "react";
import { DataTable, type DataTableColumn } from "@/components/patterns/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeMemberRole, changeMemberStatus } from "./actions";
import { P1_ROLE_OPTIONS } from "./roles";

export interface MemberRow {
  id: string;
  displayName: string;
  email: string;
  roleCode: string;
  roleLabel: string;
  status: "invited" | "active" | "suspended";
}

const STATUS_LABEL: Record<MemberRow["status"], string> = {
  invited: "Invité",
  active: "Actif",
  suspended: "Suspendu",
};

const STATUS_VARIANT: Record<MemberRow["status"], "default" | "secondary" | "outline"> = {
  invited: "outline",
  active: "default",
  suspended: "secondary",
};

function MemberRoleSelect({ row }: { row: MemberRow }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      key={row.roleCode}
      defaultValue={row.roleCode}
      disabled={pending}
      items={P1_ROLE_OPTIONS.map((role) => ({ value: role.code, label: role.label }))}
      onValueChange={(value) => {
        if (value) startTransition(() => changeMemberRole(row.id, value));
      }}
    >
      <SelectTrigger className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {P1_ROLE_OPTIONS.map((role) => (
          <SelectItem key={role.code} value={role.code}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MemberStatusAction({ row }: { row: MemberRow }) {
  const [pending, startTransition] = useTransition();
  if (row.status === "invited") return null;

  const nextStatus = row.status === "active" ? "suspended" : "active";

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => changeMemberStatus(row.id, nextStatus))}
    >
      {row.status === "active" ? "Suspendre" : "Réactiver"}
    </Button>
  );
}

const columns: DataTableColumn<MemberRow>[] = [
  {
    id: "name",
    header: "Membre",
    cell: (row) => (
      <div>
        <p className="font-medium text-foreground">{row.displayName}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    ),
  },
  {
    id: "role",
    header: "Rôle",
    cell: (row) => <MemberRoleSelect row={row} />,
  },
  {
    id: "status",
    header: "Statut",
    cell: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
  },
  {
    id: "actions",
    header: "",
    className: "text-right",
    cell: (row) => (
      <div className="flex justify-end">
        <MemberStatusAction row={row} />
      </div>
    ),
  },
];

export function MembersTable({ rows }: { rows: MemberRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      searchable={(row, query) =>
        row.displayName.toLowerCase().includes(query) || row.email.toLowerCase().includes(query)
      }
      searchPlaceholder="Rechercher un membre de l'équipe…"
      emptyTitle="Aucun utilisateur"
      emptyDescription="Invitez votre équipe pour commencer."
    />
  );
}
