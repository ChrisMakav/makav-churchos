import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { GroupForm } from "../../group-form";
import { updateGroup } from "../../actions";

export default async function ModifierGroupePage({
  params,
}: PageProps<"/groupes/[id]/modifier">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, description, meeting_day, meeting_time, location, capacity")
    .eq("id", id)
    .eq("organization_id", session.activeOrg.organizationId)
    .maybeSingle();

  if (!group) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Modifier ${group.name}`} />
      <GroupForm
        action={updateGroup.bind(null, session.activeOrg.organizationId, group.id)}
        initialValues={{
          name: group.name,
          description: group.description ?? "",
          meetingDay: group.meeting_day ?? "",
          meetingTime: group.meeting_time ? group.meeting_time.slice(0, 5) : "",
          location: group.location ?? "",
          capacity: group.capacity ? String(group.capacity) : "",
        }}
        submitLabel="Enregistrer"
      />
    </div>
  );
}
