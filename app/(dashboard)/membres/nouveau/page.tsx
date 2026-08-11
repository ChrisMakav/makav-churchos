import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { MemberForm } from "../member-form";
import { createMember } from "../actions";

export default async function NouveauMembrePage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: families } = await supabase
    .from("families")
    .select("id, name")
    .eq("organization_id", session.activeOrg.organizationId)
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau membre" />
      <MemberForm
        action={createMember.bind(null, session.activeOrg.organizationId)}
        families={families ?? []}
        submitLabel="Créer le membre"
      />
    </div>
  );
}
