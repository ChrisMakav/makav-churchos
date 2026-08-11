import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { DepartmentMembersPanel } from "./department-members-panel";

export default async function DepartmentDetailPage({
  params,
}: PageProps<"/departements/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: department }, { data: departmentMembers }, { data: allMembers }] =
    await Promise.all([
      supabase
        .from("departments")
        .select("id, name, description, leader_member_id")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("department_members")
        .select("role_in_department, members(id, first_name, last_name)")
        .eq("department_id", id),
      supabase
        .from("members")
        .select("id, first_name, last_name")
        .eq("organization_id", organizationId)
        .order("first_name"),
    ]);

  if (!department) notFound();

  const memberIdsInDepartment = new Set((departmentMembers ?? []).map((dm) => dm.members?.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title={department.name}
        description={department.description ?? undefined}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/departements/${department.id}/modifier`} />}
            nativeButton={false}
          >
            <PencilIcon className="h-4 w-4" />
            Modifier
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Membres du département</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentMembersPanel
            organizationId={organizationId}
            departmentId={department.id}
            leaderMemberId={department.leader_member_id}
            members={(departmentMembers ?? [])
              .filter((dm) => dm.members)
              .map((dm) => ({
                id: dm.members!.id,
                fullName: `${dm.members!.first_name} ${dm.members!.last_name}`,
                roleInDepartment: dm.role_in_department,
              }))}
            availableMembers={(allMembers ?? [])
              .filter((m) => !memberIdsInDepartment.has(m.id))
              .map((m) => ({ id: m.id, fullName: `${m.first_name} ${m.last_name}` }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
