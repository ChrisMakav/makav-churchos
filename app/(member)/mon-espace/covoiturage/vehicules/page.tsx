import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { DeleteVehicleButton } from "./delete-vehicle-button";

export default async function MesVehiculesPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("carpool_vehicles")
    .select("id, brand, model, color, plate_masked, seat_capacity, is_pmr_accessible")
    .eq("member_id", session.member.id)
    .order("created_at", { ascending: false });

  const rows = vehicles ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes véhicules"
        actions={
          <Button render={<Link href="/mon-espace/covoiturage/vehicules/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Ajouter un véhicule
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Aucun véhicule" description="Ajoutez un véhicule pour pouvoir proposer un trajet." />
      ) : (
        <div className="space-y-2">
          {rows.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {v.brand} {v.model} {v.color ? `· ${v.color}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {v.seat_capacity} places{v.plate_masked ? ` · ${v.plate_masked}` : ""}
                  {v.is_pmr_accessible ? " · Accessible PMR" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {v.is_pmr_accessible ? <Badge variant="outline">PMR</Badge> : null}
                <DeleteVehicleButton vehicleId={v.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
