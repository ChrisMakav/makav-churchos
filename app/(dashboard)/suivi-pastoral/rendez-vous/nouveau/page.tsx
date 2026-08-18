import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { AppointmentSlotForm, type PastorOption } from "../appointment-slot-form";
import { createAppointmentSlot } from "../actions";

export default async function NouveauCreneauPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, roles(code)")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  const pastorUserIds = (memberships ?? [])
    .filter((m) => m.roles?.code === "pastor")
    .map((m) => m.user_id)
    .filter((id): id is string => Boolean(id));

  const { data: profiles } = pastorUserIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", pastorUserIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

  const pastors: PastorOption[] = (profiles ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name || p.email || "Pasteur",
  }));

  const defaultPastorUserId = pastors.some((p) => p.id === session.user.id)
    ? session.user.id
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau créneau" description="Publier une disponibilité pour un rendez-vous pastoral." />
      <AppointmentSlotForm
        action={createAppointmentSlot.bind(null, organizationId)}
        pastors={pastors}
        defaultPastorUserId={defaultPastorUserId}
      />
    </div>
  );
}
