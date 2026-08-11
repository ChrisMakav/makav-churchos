import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export default async function DepartementsPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: departments }, { data: memberCounts }] = await Promise.all([
    supabase
      .from("departments")
      .select("id, name, description, members!departments_leader_member_id_fkey(first_name, last_name)")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase.from("department_members").select("department_id"),
  ]);

  const countByDepartment = new Map<string, number>();
  for (const row of memberCounts ?? []) {
    countByDepartment.set(row.department_id, (countByDepartment.get(row.department_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Départements"
        description={`${departments?.length ?? 0} département${(departments?.length ?? 0) > 1 ? "s" : ""}.`}
        actions={
          <Button render={<Link href="/departements/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouveau département
          </Button>
        }
      />

      {!departments || departments.length === 0 ? (
        <EmptyState
          title="Aucun département"
          description="Créez vos premiers ministères (Louange, Accueil, Jeunesse…)."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <Link key={department.id} href={`/departements/${department.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">{department.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {department.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {department.description}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {countByDepartment.get(department.id) ?? 0} membre
                    {(countByDepartment.get(department.id) ?? 0) > 1 ? "s" : ""}
                    {department.members
                      ? ` · Responsable : ${department.members.first_name} ${department.members.last_name}`
                      : ""}
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
