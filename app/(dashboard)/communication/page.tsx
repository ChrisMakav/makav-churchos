import { PageHeader } from "@/components/patterns/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { CHANNEL_LABELS, type CommunicationChannel } from "@/lib/validation/communications";
import { CommunicationComposer, type SegmentOption } from "./communication-composer";

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const CHANNEL_BADGE_VARIANT: Record<CommunicationChannel, "default" | "secondary" | "outline"> = {
  app: "secondary",
  email: "default",
  sms: "outline",
};

export default async function CommunicationPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [
    { data: departments },
    { data: departmentMembers },
    { data: sites },
    { data: siteMembers },
    { count: activeMemberCount },
    { data: recent },
  ] = await Promise.all([
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("department_members").select("department_id"),
    supabase.from("sites").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("members").select("site_id").eq("organization_id", organizationId).eq("member_status", "active"),
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("member_status", "active"),
    supabase
      .from("communications")
      .select(
        "id, title, channel, status, recipient_count, segment_summary, scheduled_at, sent_at, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const deptCounts = new Map<string, number>();
  for (const row of departmentMembers ?? []) {
    deptCounts.set(row.department_id, (deptCounts.get(row.department_id) ?? 0) + 1);
  }
  const siteCounts = new Map<string, number>();
  for (const row of siteMembers ?? []) {
    if (row.site_id) siteCounts.set(row.site_id, (siteCounts.get(row.site_id) ?? 0) + 1);
  }

  const availableSegments: SegmentOption[] = [
    { type: "all", id: null, label: "Tous les membres", count: activeMemberCount ?? 0 },
    ...(departments ?? []).map((d) => ({
      type: "department" as const,
      id: d.id,
      label: d.name,
      count: deptCounts.get(d.id) ?? 0,
    })),
    ...(sites ?? []).map((s) => ({
      type: "site" as const,
      id: s.id,
      label: s.name,
      count: siteCounts.get(s.id) ?? 0,
    })),
  ];

  const appCommunicationIds = (recent ?? []).filter((c) => c.channel === "app").map((c) => c.id);
  const { data: notifStats } = appCommunicationIds.length
    ? await supabase
        .from("notifications")
        .select("communication_id, read_at")
        .in("communication_id", appCommunicationIds)
    : { data: [] as { communication_id: string | null; read_at: string | null }[] };

  const statsByCommunication = new Map<string, { delivered: number; read: number }>();
  for (const row of notifStats ?? []) {
    if (!row.communication_id) continue;
    const current = statsByCommunication.get(row.communication_id) ?? { delivered: 0, read: 0 };
    current.delivered += 1;
    if (row.read_at) current.read += 1;
    statsByCommunication.set(row.communication_id, current);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication"
        description="SMS, email et notifications de l'application membre"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <CommunicationComposer organizationId={organizationId} availableSegments={availableSegments} />

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Envois récents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!recent || recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun envoi pour le moment.</p>
            ) : (
              recent.map((c) => {
                const channel = c.channel as CommunicationChannel;
                const stats = statsByCommunication.get(c.id);
                return (
                  <div key={c.id} className="space-y-1 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{c.title}</p>
                      <Badge variant={CHANNEL_BADGE_VARIANT[channel]} className="shrink-0">
                        {CHANNEL_LABELS[channel]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.segment_summary}</p>
                    {c.status === "scheduled" ? (
                      <p className="text-xs text-chart-4">
                        Programmé pour {c.scheduled_at ? dateTimeFormatter.format(new Date(c.scheduled_at)) : "—"}
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {c.recipient_count} destinataire{c.recipient_count > 1 ? "s" : ""}
                          {stats ? ` · ${stats.delivered} notifié${stats.delivered > 1 ? "s" : ""} · ${stats.read} lu${stats.read > 1 ? "s" : ""}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.sent_at ? dateTimeFormatter.format(new Date(c.sent_at)) : ""}
                        </p>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
