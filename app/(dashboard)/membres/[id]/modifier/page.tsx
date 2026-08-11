import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { MemberForm } from "../../member-form";
import { updateMember } from "../../actions";

export default async function ModifierMembrePage({
  params,
}: PageProps<"/membres/[id]/modifier">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: member }, { data: families }] = await Promise.all([
    supabase
      .from("members")
      .select(
        "id, first_name, last_name, email, phone, birth_date, gender, member_status, join_date, family_id, family_role",
      )
      .eq("id", id)
      .eq("organization_id", session.activeOrg.organizationId)
      .maybeSingle(),
    supabase
      .from("families")
      .select("id, name")
      .eq("organization_id", session.activeOrg.organizationId)
      .order("name"),
  ]);

  if (!member) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Modifier ${member.first_name} ${member.last_name}`} />
      <MemberForm
        action={updateMember.bind(null, session.activeOrg.organizationId, member.id)}
        families={families ?? []}
        submitLabel="Enregistrer"
        initialValues={{
          firstName: member.first_name,
          lastName: member.last_name,
          email: member.email ?? "",
          phone: member.phone ?? "",
          birthDate: member.birth_date ?? "",
          gender: member.gender ?? "",
          memberStatus: member.member_status,
          joinDate: member.join_date ?? "",
          familyId: member.family_id ?? "",
          familyRole: member.family_role ?? "",
        }}
      />
    </div>
  );
}
