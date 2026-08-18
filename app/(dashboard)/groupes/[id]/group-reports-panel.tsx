"use client";

import { useTransition } from "react";
import Link from "next/link";
import { PencilIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteGroupReport } from "../actions";

export interface GroupReportRow {
  id: string;
  meetingDate: string;
  theme: string;
  womenCount: number;
  menCount: number;
  teensCount: number;
  childrenCount: number;
  totalCount: number;
  newPeopleCount: number;
  newBirthsCount: number;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" });

export function GroupReportsPanel({
  organizationId,
  groupId,
  reports,
}: {
  organizationId: string;
  groupId: string;
  reports: GroupReportRow[];
}) {
  const [pending, startTransition] = useTransition();

  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun rapport enregistré pour cette cellule.</p>;
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <div
          key={report.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{report.theme}</p>
            <p className="text-xs text-muted-foreground">
              {dateFormatter.format(new Date(`${report.meetingDate}T00:00:00Z`))} ·{" "}
              {report.totalCount} présent{report.totalCount > 1 ? "s" : ""} ({report.womenCount}F /{" "}
              {report.menCount}H / {report.teensCount}A / {report.childrenCount}E)
              {report.newPeopleCount > 0 ? ` · ${report.newPeopleCount} nouvelle(s) personne(s)` : ""}
              {report.newBirthsCount > 0 ? ` · ${report.newBirthsCount} naissance(s)` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {report.newPeopleCount > 0 ? <Badge variant="secondary">{report.newPeopleCount} nouveaux</Badge> : null}
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link href={`/groupes/${groupId}/rapports/${report.id}/modifier`} />}
              nativeButton={false}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={() => startTransition(() => deleteGroupReport(organizationId, groupId, report.id))}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
