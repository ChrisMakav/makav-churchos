import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { PrintButton } from "./print-button";

interface StubProps {
  label: string;
  securityCode: string;
  childName: string;
  eventTitle: string | null;
  guardianName: string;
  notes: string | null;
  checkedInAt: string;
}

function Stub({ label, securityCode, childName, eventTitle, guardianName, notes, checkedInAt }: StubProps) {
  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border p-8 text-center print:border-solid">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-heading text-6xl text-primary">{securityCode}</p>
      <div className="space-y-1">
        <p className="text-lg font-medium text-foreground">{childName}</p>
        {eventTitle ? <p className="text-sm text-muted-foreground">{eventTitle}</p> : null}
        <p className="text-sm text-muted-foreground">{guardianName}</p>
        {notes ? <p className="text-sm font-medium text-warning">{notes}</p> : null}
      </div>
      <p className="text-xs text-muted-foreground">{formatDateTime(checkedInAt)}</p>
    </div>
  );
}

export default async function EtiquetteCheckinPage({
  params,
}: PageProps<"/checkin/[id]/etiquette">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: checkinSession } = await supabase
    .from("checkin_sessions")
    .select(
      "id, guardian_name, guardian_phone, security_code, notes, checked_in_at, members(first_name, last_name), events(title)",
    )
    .eq("id", id)
    .eq("organization_id", session.activeOrg.organizationId)
    .maybeSingle();

  if (!checkinSession) notFound();

  const childName = checkinSession.members
    ? `${checkinSession.members.first_name} ${checkinSession.members.last_name}`
    : "—";

  const stubProps: StubProps = {
    label: "",
    securityCode: checkinSession.security_code,
    childName,
    eventTitle: checkinSession.events?.title ?? null,
    guardianName: checkinSession.guardian_name,
    notes: checkinSession.notes,
    checkedInAt: checkinSession.checked_in_at,
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 bg-background px-6 py-12 print:px-0 print:py-0">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Stub {...stubProps} label="Étiquette enfant" />
        <Stub {...stubProps} label="Talon parent" />
      </div>

      <p className="text-center text-xs text-muted-foreground print:hidden">
        Découpez les deux étiquettes : l&apos;une reste sur l&apos;enfant, l&apos;autre est
        conservée par le parent/tuteur pour la récupération.
      </p>
    </main>
  );
}
