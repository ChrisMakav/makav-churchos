import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { MarkMatchedButton } from "./mark-matched-button";

export default async function CovoiturageBesoinsPage() {
  const session = await getSession();
  if (!session) return null;
  const organizationId = session.activeOrg.organizationId;

  const supabase = await createClient();
  const { data: needs } = await supabase
    .from("carpool_ride_needs")
    .select("id, departure_label, needed_by, seats_needed, has_children, notes, status, members(first_name, last_name), events(title)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  const rows = needs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Besoins de transport"
        description="Membres ayant signalé avoir besoin d'un trajet."
      />

      {rows.length === 0 ? (
        <EmptyState title="Aucun besoin signalé" description="Aucun membre n'a encore signalé de besoin de transport." />
      ) : (
        <div className="space-y-2">
          {rows.map((need) => (
            <div key={need.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {need.members ? `${need.members.first_name} ${need.members.last_name}` : "—"} · {need.departure_label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {need.seats_needed} place{need.seats_needed > 1 ? "s" : ""}
                  {need.has_children ? " · avec enfants" : ""}
                  {need.needed_by ? ` · pour le ${formatDateTime(need.needed_by)}` : ""}
                  {need.events ? ` · ${need.events.title}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={need.status === "open" ? "outline" : "secondary"}>{need.status}</Badge>
                {need.status === "open" ? (
                  <MarkMatchedButton organizationId={organizationId} needId={need.id} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
