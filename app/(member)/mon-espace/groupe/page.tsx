import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { MEETING_DAY_OPTIONS } from "@/lib/validation/groups";

const DAY_LABEL = Object.fromEntries(MEETING_DAY_OPTIONS.map((o) => [o.value, o.label]));

export default async function MonGroupePage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("member_id", session.member.id);

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  const { data: groups } = groupIds.length
    ? await supabase
        .from("groups")
        .select("id, name, description, meeting_day, meeting_time, location, capacity")
        .in("id", groupIds)
    : { data: [] };

  return (
    <div className="space-y-6">
      <PageHeader title="Mon groupe" />

      {!groups || groups.length === 0 ? (
        <EmptyState
          title="Aucun groupe"
          description="Vous n'êtes rattaché à aucun groupe ou cellule pour le moment."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((g) => {
            const schedule = [
              g.meeting_day ? DAY_LABEL[g.meeting_day] : null,
              g.meeting_time ? g.meeting_time.slice(0, 5) : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <Card key={g.id}>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">{g.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {g.description ? (
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  ) : null}
                  {schedule ? <p className="text-sm text-muted-foreground">{schedule}</p> : null}
                  {g.location ? <p className="text-sm text-muted-foreground">{g.location}</p> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
