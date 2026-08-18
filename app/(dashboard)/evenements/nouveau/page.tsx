import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { EventForm } from "../event-form";
import { createEvent } from "../actions";

export default async function NouvelEvenementPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: eventTypes }, { data: departments }, { data: rooms }] = await Promise.all([
    supabase
      .from("event_types")
      .select("id, label_fr")
      .eq("organization_id", organizationId)
      .order("label_fr"),
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("rooms").select("id, name").eq("organization_id", organizationId).order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Nouvel événement" />
      <EventForm
        action={createEvent.bind(null, organizationId)}
        eventTypes={(eventTypes ?? []).map((t) => ({ id: t.id, label: t.label_fr }))}
        departments={departments ?? []}
        rooms={rooms ?? []}
        submitLabel="Créer l'événement"
      />
    </div>
  );
}
