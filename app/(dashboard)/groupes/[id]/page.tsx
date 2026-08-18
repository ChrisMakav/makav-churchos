import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { MEETING_DAY_OPTIONS } from "@/lib/validation/groups";
import { GroupMembersPanel } from "./group-members-panel";
import { GroupStatusSelect } from "./group-status-select";
import { GroupReportsPanel } from "./group-reports-panel";

const DAY_LABEL = Object.fromEntries(MEETING_DAY_OPTIONS.map((o) => [o.value, o.label]));

export default async function GroupDetailPage({
  params,
}: PageProps<"/groupes/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: group }, { data: groupMembers }, { data: allMembers }, { data: groupReports }] =
    await Promise.all([
      supabase
        .from("groups")
        .select(
          "id, name, description, leader_member_id, status, meeting_day, meeting_time, location, capacity",
        )
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("group_members")
        .select("role_in_group, members(id, first_name, last_name)")
        .eq("group_id", id),
      supabase
        .from("members")
        .select("id, first_name, last_name")
        .eq("organization_id", organizationId)
        .order("first_name"),
      supabase
        .from("group_reports")
        .select(
          "id, meeting_date, theme, women_count, men_count, teens_count, children_count, total_count, new_people_count, new_births_count",
        )
        .eq("group_id", id)
        .eq("organization_id", organizationId)
        .order("meeting_date", { ascending: false }),
    ]);

  if (!group) notFound();

  const memberIdsInGroup = new Set((groupMembers ?? []).map((gm) => gm.members?.id));
  const memberCount = (groupMembers ?? []).length;

  const schedule = [
    group.meeting_day ? DAY_LABEL[group.meeting_day] : null,
    group.meeting_time ? group.meeting_time.slice(0, 5) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        description={group.description ?? undefined}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/groupes/${group.id}/modifier`} />}
            nativeButton={false}
          >
            <PencilIcon className="h-4 w-4" />
            Modifier
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Statut :</span>
          <GroupStatusSelect organizationId={organizationId} groupId={group.id} status={group.status} />
        </div>
        {schedule ? (
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground">Rencontre :</span> {schedule}
          </p>
        ) : null}
        {group.location ? (
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground">Lieu :</span> {group.location}
          </p>
        ) : null}
        {group.capacity ? (
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground">Capacité :</span> {memberCount}/{group.capacity}
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Membres du groupe</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupMembersPanel
            organizationId={organizationId}
            groupId={group.id}
            leaderMemberId={group.leader_member_id}
            members={(groupMembers ?? [])
              .filter((gm) => gm.members)
              .map((gm) => ({
                id: gm.members!.id,
                fullName: `${gm.members!.first_name} ${gm.members!.last_name}`,
                roleInGroup: gm.role_in_group,
              }))}
            availableMembers={(allMembers ?? [])
              .filter((m) => !memberIdsInGroup.has(m.id))
              .map((m) => ({ id: m.id, fullName: `${m.first_name} ${m.last_name}` }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">Rapports d&apos;activité</CardTitle>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/groupes/${group.id}/rapports/nouveau`} />}
            nativeButton={false}
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau rapport
          </Button>
        </CardHeader>
        <CardContent>
          <GroupReportsPanel
            organizationId={organizationId}
            groupId={group.id}
            reports={(groupReports ?? []).map((r) => ({
              id: r.id,
              meetingDate: r.meeting_date,
              theme: r.theme,
              womenCount: r.women_count,
              menCount: r.men_count,
              teensCount: r.teens_count,
              childrenCount: r.children_count,
              totalCount: r.total_count,
              newPeopleCount: r.new_people_count,
              newBirthsCount: r.new_births_count,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
