import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export default async function CovoiturageChauffeursPage() {
  const session = await getSession();
  if (!session) return null;
  const organizationId = session.activeOrg.organizationId;

  const supabase = await createClient();
  const { data: drivers } = await supabase
    .from("carpool_driver_availabilities")
    .select(
      "id, zones, frequency, notes, is_active, members(first_name, last_name), carpool_vehicles(brand, model, seat_capacity)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  const rows = drivers ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chauffeurs bénévoles"
        description="Membres ayant déclaré leur disponibilité pour conduire."
      />

      {rows.length === 0 ? (
        <EmptyState title="Aucun chauffeur déclaré" description="Aucun membre ne s'est encore déclaré chauffeur bénévole." />
      ) : (
        <div className="space-y-2">
          {rows.map((d) => (
            <div key={d.id} className="rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {d.members ? `${d.members.first_name} ${d.members.last_name}` : "—"}
                </p>
                <Badge variant={d.is_active ? "outline" : "secondary"}>{d.is_active ? "Actif" : "Inactif"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {d.carpool_vehicles ? `${d.carpool_vehicles.brand} ${d.carpool_vehicles.model} (${d.carpool_vehicles.seat_capacity} places)` : "Aucun véhicule renseigné"}
                {d.zones ? ` · Zones : ${d.zones}` : ""}
                {d.frequency ? ` · Fréquence : ${d.frequency}` : ""}
              </p>
              {d.notes ? <p className="text-xs text-muted-foreground">{d.notes}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
