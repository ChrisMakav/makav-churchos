import Link from "next/link";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { EventsList, type EventRow } from "./events-list";

export default async function EvenementsPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, location, starts_at, status, event_types(label_fr, color)")
    .eq("organization_id", session.activeOrg.organizationId)
    .order("starts_at", { ascending: true });

  const rows: EventRow[] = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    typeLabel: e.event_types?.label_fr ?? "—",
    typeColor: e.event_types?.color ?? "#8a7b68",
    startsAt: e.starts_at,
    location: e.location,
    status: e.status,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Événements"
        description={`${rows.length} événement${rows.length > 1 ? "s" : ""}.`}
        actions={
          <>
            <Button
              variant="outline"
              render={<Link href="/evenements/calendrier" />}
              nativeButton={false}
            >
              <CalendarIcon className="h-4 w-4" />
              Calendrier
            </Button>
            <Button render={<Link href="/evenements/nouveau" />} nativeButton={false}>
              <PlusIcon className="h-4 w-4" />
              Nouvel événement
            </Button>
          </>
        }
      />
      <EventsList rows={rows} />
    </div>
  );
}
