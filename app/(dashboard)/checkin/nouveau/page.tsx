import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { CheckinForm } from "../checkin-form";
import { createCheckin } from "../actions";

export default async function NouveauCheckinPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const [{ data: members }, { data: events }] = await Promise.all([
    supabase
      .from("members")
      .select("id, first_name, last_name")
      .eq("organization_id", organizationId)
      .order("first_name"),
    supabase
      .from("events")
      .select("id, title, starts_at")
      .eq("organization_id", organizationId)
      .eq("status", "scheduled")
      .order("starts_at", { ascending: true })
      .limit(20),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau check-in" />
      <CheckinForm
        action={createCheckin.bind(null, organizationId)}
        childOptions={(members ?? []).map((m) => ({ id: m.id, fullName: `${m.first_name} ${m.last_name}` }))}
        events={(events ?? []).map((e) => ({ id: e.id, title: e.title }))}
      />
    </div>
  );
}
