import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { PageHeader } from "@/components/patterns/page-header";
import { MyAppointmentsList, type MyAppointmentRow } from "./my-appointments-list";
import { AppointmentCalendar, type OpenSlot } from "./appointment-calendar";

export default async function RendezVousPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: mine }, { data: openSlots }] = await Promise.all([
    supabase
      .from("pastoral_appointment_slots")
      .select("id, pastor_user_id, starts_at, ends_at, location, status, reason")
      .eq("member_id", session.member.id)
      .order("starts_at", { ascending: false }),
    supabase
      .from("pastoral_appointment_slots")
      .select("id, pastor_user_id, starts_at, ends_at, location")
      .eq("organization_id", session.member.organizationId)
      .eq("status", "open")
      .order("starts_at", { ascending: true }),
  ]);

  const pastorUserIds = Array.from(
    new Set([...(mine ?? []).map((s) => s.pastor_user_id), ...(openSlots ?? []).map((s) => s.pastor_user_id)]),
  );
  const { data: profiles } = pastorUserIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", pastorUserIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const pastorNameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name || p.email || "Pasteur"]),
  );

  const myAppointments: MyAppointmentRow[] = (mine ?? []).map((s) => ({
    id: s.id,
    pastorName: pastorNameById.get(s.pastor_user_id) ?? "Pasteur",
    startsAt: s.starts_at,
    endsAt: s.ends_at,
    location: s.location,
    status: s.status as MyAppointmentRow["status"],
    reason: s.reason,
  }));

  const availableSlots: OpenSlot[] = (openSlots ?? []).map((s) => ({
    id: s.id,
    pastorName: pastorNameById.get(s.pastor_user_id) ?? "Pasteur",
    startsAt: s.starts_at,
    endsAt: s.ends_at,
    location: s.location,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rendez-vous avec le pasteur"
        description="Vos demandes sont confidentielles : seul le pasteur concerné y a accès."
      />

      <div className="space-y-2">
        <h2 className="font-heading text-lg text-foreground">Mes rendez-vous</h2>
        <MyAppointmentsList appointments={myAppointments} />
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-lg text-foreground">Prendre rendez-vous</h2>
        <AppointmentCalendar slots={availableSlots} />
      </div>
    </div>
  );
}
