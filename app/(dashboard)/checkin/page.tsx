import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { CheckinSessionsList, type CheckinSessionRow } from "./checkin-sessions-list";

export default async function CheckinPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("checkin_sessions")
    .select(
      "id, guardian_name, guardian_phone, security_code, checked_in_at, checked_out_at, members(first_name, last_name), events(title)",
    )
    .eq("organization_id", organizationId)
    .order("checked_in_at", { ascending: false })
    .limit(100);

  const rows: CheckinSessionRow[] = (sessions ?? []).map((s) => ({
    id: s.id,
    childName: s.members ? `${s.members.first_name} ${s.members.last_name}` : "—",
    guardianName: s.guardian_name,
    guardianPhone: s.guardian_phone,
    securityCode: s.security_code,
    eventTitle: s.events?.title ?? null,
    checkedInAt: s.checked_in_at,
    checkedOutAt: s.checked_out_at,
  }));

  const active = rows.filter((r) => !r.checkedOutAt);
  const history = rows.filter((r) => r.checkedOutAt).slice(0, 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Check-in enfants"
        description="Arrivées et départs de l'espace enfants."
        actions={
          <Button render={<Link href="/checkin/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouveau check-in
          </Button>
        }
      />

      <CheckinSessionsList organizationId={organizationId} active={active} history={history} />
    </div>
  );
}
