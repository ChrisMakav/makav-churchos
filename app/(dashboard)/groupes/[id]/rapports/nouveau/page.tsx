import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { GroupReportForm } from "../../group-report-form";
import { createGroupReport } from "../../../actions";

export default async function NouveauRapportPage({
  params,
}: PageProps<"/groupes/[id]/rapports/nouveau">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!group) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau rapport d'activité" description={group.name} />
      <GroupReportForm action={createGroupReport.bind(null, organizationId, group.id)} submitLabel="Enregistrer le rapport" />
    </div>
  );
}
