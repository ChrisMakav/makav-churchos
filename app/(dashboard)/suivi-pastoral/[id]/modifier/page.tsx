import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { PastoralRecordForm } from "../../pastoral-record-form";
import { updatePastoralRecord } from "../../actions";

export default async function ModifierSuiviPastoralPage({
  params,
}: PageProps<"/suivi-pastoral/[id]/modifier">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const [{ data: record }, { data: members }] = await Promise.all([
    supabase
      .from("pastoral_records")
      .select("id, member_id, category, notes, follow_up_date")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("members")
      .select("id, first_name, last_name")
      .eq("organization_id", organizationId)
      .order("first_name"),
  ]);

  if (!record) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Modifier le suivi pastoral" />
      <PastoralRecordForm
        action={updatePastoralRecord.bind(null, organizationId, record.id)}
        members={(members ?? []).map((m) => ({ id: m.id, fullName: `${m.first_name} ${m.last_name}` }))}
        initialValues={{
          memberId: record.member_id,
          category: record.category,
          notes: record.notes,
          followUpDate: record.follow_up_date ?? "",
        }}
        submitLabel="Enregistrer"
      />
    </div>
  );
}
