import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { toDatetimeLocalValue } from "@/lib/format";
import { EventForm } from "../../event-form";
import { updateEvent } from "../../actions";

export default async function ModifierEvenementPage({
  params,
}: PageProps<"/evenements/[id]/modifier">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: event }, { data: eventTypes }, { data: departments }, { data: rooms }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, title, description, location, room_id, starts_at, ends_at, capacity, event_type_id, department_id",
      )
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase.from("event_types").select("id, label_fr").eq("organization_id", organizationId).order("label_fr"),
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("rooms").select("id, name").eq("organization_id", organizationId).order("name"),
  ]);

  if (!event) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Modifier ${event.title}`} />
      <EventForm
        action={updateEvent.bind(null, organizationId, event.id)}
        eventTypes={(eventTypes ?? []).map((t) => ({ id: t.id, label: t.label_fr }))}
        departments={departments ?? []}
        rooms={rooms ?? []}
        submitLabel="Enregistrer"
        initialValues={{
          title: event.title,
          eventTypeId: event.event_type_id,
          description: event.description ?? "",
          location: event.location ?? "",
          roomId: event.room_id ?? "",
          startsAt: toDatetimeLocalValue(event.starts_at),
          endsAt: toDatetimeLocalValue(event.ends_at),
          departmentId: event.department_id ?? "",
          capacity: event.capacity != null ? String(event.capacity) : "",
        }}
      />
    </div>
  );
}
