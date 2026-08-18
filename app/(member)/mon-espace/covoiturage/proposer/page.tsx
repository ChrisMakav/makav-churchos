import Link from "next/link";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { RideForm } from "./ride-form";

export default async function ProposerTrajetPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: vehicles }, { data: events }] = await Promise.all([
    supabase
      .from("carpool_vehicles")
      .select("id, brand, model, seat_capacity")
      .eq("member_id", session.member.id),
    supabase
      .from("events")
      .select("id, title")
      .eq("organization_id", session.member.organizationId)
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(20),
  ]);

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Proposer un trajet" />
        <EmptyState
          title="Aucun véhicule enregistré"
          description="Ajoutez d'abord un véhicule avant de proposer un trajet."
          action={
            <Button render={<Link href="/mon-espace/covoiturage/vehicules/nouveau" />} nativeButton={false}>
              Ajouter un véhicule
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Proposer un trajet" />
      <RideForm
        vehicles={vehicles.map((v) => ({ id: v.id, label: `${v.brand} ${v.model} (${v.seat_capacity} places)`, seatCapacity: v.seat_capacity }))}
        events={(events ?? []).map((e) => ({ id: e.id, title: e.title }))}
      />
    </div>
  );
}
