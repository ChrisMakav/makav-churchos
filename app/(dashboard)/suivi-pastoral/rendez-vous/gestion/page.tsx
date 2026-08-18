import { redirect } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { PastoralManagersPanel, type ManagerRow, type StaffOption } from "../pastoral-managers-panel";

export default async function GestionRendezVousPage() {
  const session = await getSession();
  if (!session) return null;

  if (!session.activeOrg.permissions.includes("organization.manage")) {
    redirect("/suivi-pastoral/rendez-vous");
  }

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const [{ data: memberships }, { data: managerRows }] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, user_id, roles(code, label_fr)")
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("pastoral_appointment_managers")
      .select("user_id")
      .eq("organization_id", organizationId),
  ]);

  const userIds = Array.from(
    new Set(
      [...(memberships ?? []).map((m) => m.user_id), ...(managerRows ?? []).map((m) => m.user_id)].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  );
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const staff: StaffOption[] = (memberships ?? [])
    .filter((m): m is typeof m & { user_id: string } => Boolean(m.user_id))
    .map((m) => {
      const profile = profileById.get(m.user_id);
      return {
        membershipId: m.id,
        userId: m.user_id,
        fullName: profile?.full_name || profile?.email || "—",
        roleCode: m.roles?.code ?? "member",
        roleLabel: m.roles?.label_fr ?? "Membre",
      };
    });

  const managers: ManagerRow[] = (managerRows ?? []).map((m) => {
    const profile = profileById.get(m.user_id);
    return { userId: m.user_id, fullName: profile?.full_name || profile?.email || "—" };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pasteurs & responsables"
        description="Qui peut gérer l'agenda des rendez-vous pastoraux."
      />
      <PastoralManagersPanel organizationId={organizationId} staff={staff} managers={managers} />
    </div>
  );
}
