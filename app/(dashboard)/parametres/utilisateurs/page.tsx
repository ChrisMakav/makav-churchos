import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { InviteForm } from "./invite-form";
import { MembersTable, type MemberRow } from "./members-table";

export default async function UtilisateursPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, user_id, invited_email, status, roles(code, label_fr)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  const userIds = (memberships ?? [])
    .map((m) => m.user_id)
    .filter((id): id is string => Boolean(id));

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows: MemberRow[] = (memberships ?? []).map((m) => {
    const profile = m.user_id ? profileById.get(m.user_id) : undefined;
    return {
      id: m.id,
      displayName: profile?.full_name || profile?.email || m.invited_email || "—",
      email: profile?.email || m.invited_email || "—",
      roleCode: m.roles?.code ?? "member",
      roleLabel: m.roles?.label_fr ?? "Membre",
      status: m.status,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Invitez votre équipe et gérez leurs rôles."
      />
      <InviteForm organizationId={organizationId} />
      <MembersTable rows={rows} />
    </div>
  );
}
