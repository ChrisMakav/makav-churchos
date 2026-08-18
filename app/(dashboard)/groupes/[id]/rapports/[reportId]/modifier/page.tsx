import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { GroupReportForm } from "../../../group-report-form";
import { updateGroupReport } from "../../../../actions";

export default async function ModifierRapportPage({
  params,
}: PageProps<"/groupes/[id]/rapports/[reportId]/modifier">) {
  const { id, reportId } = await params;
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const [{ data: group }, { data: report }] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("group_reports")
      .select(
        "id, meeting_date, theme, women_count, men_count, teens_count, children_count, new_people_count, new_births_count, notes",
      )
      .eq("id", reportId)
      .eq("group_id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  if (!group || !report) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Modifier le rapport d'activité" description={group.name} />
      <GroupReportForm
        action={updateGroupReport.bind(null, organizationId, group.id, report.id)}
        initialValues={{
          meetingDate: report.meeting_date,
          theme: report.theme,
          womenCount: String(report.women_count),
          menCount: String(report.men_count),
          teensCount: String(report.teens_count),
          childrenCount: String(report.children_count),
          newPeopleCount: String(report.new_people_count),
          newBirthsCount: String(report.new_births_count),
          notes: report.notes ?? "",
        }}
        submitLabel="Enregistrer"
      />
    </div>
  );
}
