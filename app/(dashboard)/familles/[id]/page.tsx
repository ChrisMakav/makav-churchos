import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { FamilyMembersPanel } from "./family-members-panel";

export default async function FamilyDetailPage({
  params,
}: PageProps<"/familles/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: family }, { data: members }, { data: available }] = await Promise.all([
    supabase
      .from("families")
      .select("id, name, head_member_id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("members")
      .select("id, first_name, last_name, family_role")
      .eq("organization_id", organizationId)
      .eq("family_id", id)
      .order("first_name"),
    supabase
      .from("members")
      .select("id, first_name, last_name")
      .eq("organization_id", organizationId)
      .is("family_id", null)
      .order("first_name"),
  ]);

  if (!family) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={family.name} description="Composition du foyer." />
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Membres du foyer</CardTitle>
        </CardHeader>
        <CardContent>
          <FamilyMembersPanel
            organizationId={organizationId}
            familyId={family.id}
            headMemberId={family.head_member_id}
            members={(members ?? []).map((m) => ({
              id: m.id,
              fullName: `${m.first_name} ${m.last_name}`,
              familyRole: m.family_role,
            }))}
            availableMembers={(available ?? []).map((m) => ({
              id: m.id,
              fullName: `${m.first_name} ${m.last_name}`,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
