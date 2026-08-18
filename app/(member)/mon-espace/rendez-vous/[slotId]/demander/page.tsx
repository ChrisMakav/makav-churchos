import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { formatDateTime, toUtcTimeLabel } from "@/lib/format";
import { AppointmentRequestForm } from "../../appointment-request-form";

export default async function DemanderRendezVousPage({
  params,
}: PageProps<"/mon-espace/rendez-vous/[slotId]/demander">) {
  const { slotId } = await params;
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: slot } = await supabase
    .from("pastoral_appointment_slots")
    .select("id, pastor_user_id, starts_at, ends_at, location, status")
    .eq("id", slotId)
    .eq("status", "open")
    .maybeSingle();

  if (!slot) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", slot.pastor_user_id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demander ce rendez-vous"
        description={`${profile?.full_name || profile?.email || "Pasteur"} · ${formatDateTime(slot.starts_at)} – ${toUtcTimeLabel(slot.ends_at)}${slot.location ? ` · ${slot.location}` : ""}`}
      />
      <AppointmentRequestForm slotId={slot.id} />
    </div>
  );
}
