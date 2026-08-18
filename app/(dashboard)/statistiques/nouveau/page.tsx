import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { AttendanceForm } from "../attendance-form";
import { createAttendanceRecord } from "../actions";

export default async function NouvelleStatistiquePage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("organization_id", organizationId)
    .order("starts_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <PageHeader title="Nouvelle statistique" description="Présence à un culte ou un rassemblement." />
      <AttendanceForm
        action={createAttendanceRecord.bind(null, organizationId)}
        events={(events ?? []).map((e) => ({ id: e.id, title: e.title }))}
      />
    </div>
  );
}
