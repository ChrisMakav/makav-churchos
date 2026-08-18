import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { RoomsManager } from "./rooms-manager";

export default async function SallesPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name, capacity")
    .eq("organization_id", organizationId)
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salles"
        description="Les salles apparaissent comme lignes dans la grille des événements et permettent de détecter les doubles réservations."
        actions={
          <Button variant="outline" render={<Link href="/evenements" />} nativeButton={false}>
            <ArrowLeftIcon className="h-4 w-4" />
            Retour aux événements
          </Button>
        }
      />
      <RoomsManager organizationId={organizationId} rooms={rooms ?? []} />
    </div>
  );
}
