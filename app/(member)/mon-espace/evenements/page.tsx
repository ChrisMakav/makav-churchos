import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { EventTypeBadge } from "@/components/patterns/event-type-badge";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export default async function MesEvenementsPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, location, starts_at, event_types(label_fr, color)")
    .eq("organization_id", session.member.organizationId)
    .eq("status", "scheduled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);

  return (
    <div className="space-y-6">
      <PageHeader title="Événements à venir" description="Les prochains rendez-vous de votre église." />

      {!events || events.length === 0 ? (
        <EmptyState title="Aucun événement à venir" />
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{e.title}</p>
                {e.event_types ? (
                  <EventTypeBadge label={e.event_types.label_fr} color={e.event_types.color} />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {dateTimeFormatter.format(new Date(e.starts_at))}
                {e.location ? ` · ${e.location}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
