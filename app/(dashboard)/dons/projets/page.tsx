import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { FundsManager } from "./funds-manager";

export default async function ProjetsPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();
  const [{ data: funds }, { data: org }] = await Promise.all([
    supabase
      .from("donation_funds")
      .select("id, name, is_restricted, is_active, goal_amount, starts_on, ends_on")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase.from("organizations").select("currency").eq("id", organizationId).single(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fonds & projets"
        description="Un fonds avec un objectif de collecte apparaît comme un projet en cours sur le tableau de bord Dons & finances."
        actions={
          <Button variant="outline" render={<Link href="/finances" />} nativeButton={false}>
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Button>
        }
      />
      <FundsManager
        organizationId={organizationId}
        currency={org?.currency ?? "XAF"}
        funds={(funds ?? []).map((f) => ({
          id: f.id,
          name: f.name,
          isRestricted: f.is_restricted,
          isActive: f.is_active,
          goalAmount: f.goal_amount,
          startsOn: f.starts_on,
          endsOn: f.ends_on,
        }))}
      />
    </div>
  );
}
