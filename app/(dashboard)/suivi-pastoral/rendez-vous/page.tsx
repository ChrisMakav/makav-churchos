import Link from "next/link";
import { PlusIcon, UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { AppointmentSlotsList, type AppointmentSlotRow } from "./appointment-slots-list";

export default async function RendezVousPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const { data: slots } = await supabase
    .from("pastoral_appointment_slots")
    .select(
      "id, pastor_user_id, starts_at, ends_at, location, status, reason, members(first_name, last_name)",
    )
    .eq("organization_id", organizationId)
    .order("starts_at", { ascending: true });

  const pastorUserIds = Array.from(new Set((slots ?? []).map((s) => s.pastor_user_id)));
  const { data: profiles } = pastorUserIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", pastorUserIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const pastorNameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name || p.email || "Pasteur"]),
  );

  const rows: AppointmentSlotRow[] = (slots ?? []).map((s) => ({
    id: s.id,
    pastorName: pastorNameById.get(s.pastor_user_id) ?? "Pasteur",
    startsAt: s.starts_at,
    endsAt: s.ends_at,
    location: s.location,
    status: s.status as AppointmentSlotRow["status"],
    reason: s.reason,
    memberName: s.members ? `${s.members.first_name} ${s.members.last_name}` : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rendez-vous pastoraux"
        description="Agenda confidentiel : visible uniquement du pasteur concerné, de ses éventuels responsables délégués et des administrateurs."
        actions={
          <div className="flex gap-2">
            {session.activeOrg.permissions.includes("organization.manage") ? (
              <Button
                variant="outline"
                render={<Link href="/suivi-pastoral/rendez-vous/gestion" />}
                nativeButton={false}
              >
                <UsersIcon className="h-4 w-4" />
                Pasteurs & responsables
              </Button>
            ) : null}
            <Button render={<Link href="/suivi-pastoral/rendez-vous/nouveau" />} nativeButton={false}>
              <PlusIcon className="h-4 w-4" />
              Nouveau créneau
            </Button>
          </div>
        }
      />

      <AppointmentSlotsList organizationId={organizationId} rows={rows} />
    </div>
  );
}
