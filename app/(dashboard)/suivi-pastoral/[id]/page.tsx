import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { PASTORAL_CATEGORY_OPTIONS } from "@/lib/validation/pastoral-care";
import { PastoralStatusSelect } from "./status-select";

const CATEGORY_LABEL = Object.fromEntries(PASTORAL_CATEGORY_OPTIONS.map((o) => [o.value, o.label]));

export default async function SuiviPastoralDetailPage({
  params,
}: PageProps<"/suivi-pastoral/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const { data: record } = await supabase
    .from("pastoral_records")
    .select(
      "id, category, notes, status, follow_up_date, created_at, members(id, first_name, last_name)",
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!record) notFound();

  const memberName = record.members ? `${record.members.first_name} ${record.members.last_name}` : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title={memberName}
        description={CATEGORY_LABEL[record.category] ?? record.category}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/suivi-pastoral/${record.id}/modifier`} />}
            nativeButton={false}
          >
            <PencilIcon className="h-4 w-4" />
            Modifier
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Statut :</span>
          <PastoralStatusSelect organizationId={organizationId} recordId={record.id} status={record.status} />
        </div>
        {record.follow_up_date ? (
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground">Relance :</span>{" "}
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(
              new Date(record.follow_up_date),
            )}
          </p>
        ) : null}
        {record.members ? (
          <Link href={`/membres/${record.members.id}`} className="text-sm text-primary hover:underline">
            Voir la fiche membre
          </Link>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-foreground">{record.notes}</p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Créé le {formatDateTime(record.created_at)}</p>
    </div>
  );
}
