import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { GROUP_STATUS_OPTIONS, MEETING_DAY_OPTIONS } from "@/lib/validation/groups";

const STATUS_LABEL = Object.fromEntries(GROUP_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const DAY_LABEL = Object.fromEntries(MEETING_DAY_OPTIONS.map((o) => [o.value, o.label]));

export default async function GroupesPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: groups }, { data: memberCounts }] = await Promise.all([
    supabase
      .from("groups")
      .select(
        "id, name, description, status, meeting_day, meeting_time, location, members!groups_leader_member_id_fkey(first_name, last_name)",
      )
      .eq("organization_id", organizationId)
      .order("name"),
    supabase.from("group_members").select("group_id"),
  ]);

  const countByGroup = new Map<string, number>();
  for (const row of memberCounts ?? []) {
    countByGroup.set(row.group_id, (countByGroup.get(row.group_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groupes & Cellules"
        description={`${groups?.length ?? 0} groupe${(groups?.length ?? 0) > 1 ? "s" : ""}.`}
        actions={
          <Button render={<Link href="/groupes/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouveau groupe
          </Button>
        }
      />

      {!groups || groups.length === 0 ? (
        <EmptyState
          title="Aucun groupe"
          description="Créez vos premières cellules de maison ou petits groupes de communion."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const schedule = [
              group.meeting_day ? DAY_LABEL[group.meeting_day] : null,
              group.meeting_time ? group.meeting_time.slice(0, 5) : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <Link key={group.id} href={`/groupes/${group.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <CardTitle className="font-heading text-lg">{group.name}</CardTitle>
                    <Badge variant={group.status === "active" ? "default" : "secondary"}>
                      {STATUS_LABEL[group.status] ?? group.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {group.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{group.description}</p>
                    ) : null}
                    {schedule ? <p className="text-sm text-muted-foreground">{schedule}</p> : null}
                    {group.location ? (
                      <p className="text-sm text-muted-foreground">{group.location}</p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {countByGroup.get(group.id) ?? 0} membre
                      {(countByGroup.get(group.id) ?? 0) > 1 ? "s" : ""}
                      {group.members
                        ? ` · Responsable : ${group.members.first_name} ${group.members.last_name}`
                        : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
