import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { PastoralRecordForm } from "../pastoral-record-form";
import { createPastoralRecord } from "../actions";

export default async function NouveauSuiviPastoralPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("members")
    .select("id, first_name, last_name")
    .eq("organization_id", session.activeOrg.organizationId)
    .order("first_name");

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau suivi pastoral" />
      <PastoralRecordForm
        action={createPastoralRecord.bind(null, session.activeOrg.organizationId)}
        members={(members ?? []).map((m) => ({ id: m.id, fullName: `${m.first_name} ${m.last_name}` }))}
        submitLabel="Enregistrer"
      />
    </div>
  );
}
