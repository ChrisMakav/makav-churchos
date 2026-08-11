import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export default async function FamillesPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: families }, { data: members }] = await Promise.all([
    supabase.from("families").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("members").select("family_id").eq("organization_id", organizationId).not("family_id", "is", null),
  ]);

  const memberCountByFamily = new Map<string, number>();
  for (const m of members ?? []) {
    if (!m.family_id) continue;
    memberCountByFamily.set(m.family_id, (memberCountByFamily.get(m.family_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Familles"
        description={`${families?.length ?? 0} famille${(families?.length ?? 0) > 1 ? "s" : ""}.`}
        actions={
          <Button render={<Link href="/familles/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouvelle famille
          </Button>
        }
      />

      {!families || families.length === 0 ? (
        <EmptyState
          title="Aucune famille"
          description="Regroupez des membres d'un même foyer pour suivre leur participation ensemble."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <Link key={family.id} href={`/familles/${family.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">{family.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {memberCountByFamily.get(family.id) ?? 0} membre
                    {(memberCountByFamily.get(family.id) ?? 0) > 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
