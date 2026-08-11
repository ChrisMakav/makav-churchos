import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventTypeBadge } from "@/components/patterns/event-type-badge";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { StatusSelect } from "./status-select";

export default async function EventDetailPage({
  params,
}: PageProps<"/evenements/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, location, starts_at, ends_at, capacity, status, event_types(label_fr, color), departments(name)",
    )
    .eq("id", id)
    .eq("organization_id", session.activeOrg.organizationId)
    .maybeSingle();

  if (!event) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.title}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/evenements/${event.id}/modifier`} />}
            nativeButton={false}
          >
            <PencilIcon className="h-4 w-4" />
            Modifier
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {event.event_types ? (
              <EventTypeBadge label={event.event_types.label_fr} color={event.event_types.color} />
            ) : null}
            {event.departments ? (
              <span className="text-sm text-muted-foreground">{event.departments.name}</span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Début</p>
              <p className="text-sm text-foreground">{formatDateTime(event.starts_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Fin</p>
              <p className="text-sm text-foreground">{formatDateTime(event.ends_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Lieu</p>
              <p className="text-sm text-foreground">{event.location || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacité</p>
              <p className="text-sm text-foreground">{event.capacity ?? "—"}</p>
            </div>
          </div>

          {event.description ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="text-sm whitespace-pre-wrap text-foreground">{event.description}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Statut :</span>
        <StatusSelect
          organizationId={session.activeOrg.organizationId}
          eventId={event.id}
          status={event.status}
        />
      </div>
    </div>
  );
}
