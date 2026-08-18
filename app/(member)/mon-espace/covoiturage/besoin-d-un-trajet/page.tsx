import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { formatDateTime } from "@/lib/format";
import { RideNeedForm } from "./ride-need-form";
import { CancelNeedButton } from "./cancel-need-button";

export default async function BesoinDUnTrajetPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: myNeeds }, { data: events }] = await Promise.all([
    supabase
      .from("carpool_ride_needs")
      .select("id, departure_label, needed_by, seats_needed, status")
      .eq("member_id", session.member.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title")
      .eq("organization_id", session.member.organizationId)
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(20),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Je cherche un trajet"
        description="Signalez que vous avez besoin d'un trajet ; nous vous préviendrons dès qu'un conducteur compatible sera disponible."
      />

      <div className="space-y-2">
        <h2 className="font-heading text-lg text-foreground">Mes besoins</h2>
        {!myNeeds || myNeeds.length === 0 ? (
          <EmptyState title="Aucun besoin signalé" description="Vous n'avez pas encore signalé de besoin de transport." />
        ) : (
          <div className="space-y-2">
            {myNeeds.map((need) => (
              <div key={need.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{need.departure_label}</p>
                  <p className="text-xs text-muted-foreground">
                    {need.seats_needed} place{need.seats_needed > 1 ? "s" : ""}
                    {need.needed_by ? ` · pour le ${formatDateTime(need.needed_by)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={need.status === "open" ? "outline" : "secondary"}>{need.status}</Badge>
                  {need.status === "open" ? <CancelNeedButton needId={need.id} /> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-lg text-foreground">Nouveau besoin</h2>
        <RideNeedForm events={(events ?? []).map((e) => ({ id: e.id, title: e.title }))} />
      </div>
    </div>
  );
}
