import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SegmentInput } from "@/lib/validation/communications";

function applyVariables(template: string, member: { first_name: string; last_name: string }) {
  return template.replaceAll("{prénom}", member.first_name).replaceAll("{nom}", member.last_name);
}

// Vercel Cron (voir vercel.ts) — dispatche les communications "app"
// programmées dont l'échéance est passée. Rejoue `segments` (persisté en
// jsonb, voir 0019_communication.sql) plutôt que de réutiliser
// recipient_count : la composition des équipes/campus a pu changer entre la
// programmation et l'échéance. Client service-role : ce job n'est rattaché à
// aucun utilisateur, il doit voir toutes les organisations (même pattern que
// budget-alerts).
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("communications")
    .select("id, organization_id, channel, title, body, segments")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let dispatched = 0;

  for (const communication of due ?? []) {
    const segments = (communication.segments as unknown as SegmentInput[] | null) ?? [];
    const byId = new Map<string, { id: string; first_name: string; last_name: string; user_id: string | null }>();

    for (const segment of segments) {
      if (segment.type === "all") {
        const { data } = await supabase
          .from("members")
          .select("id, first_name, last_name, user_id")
          .eq("organization_id", communication.organization_id)
          .eq("member_status", "active");
        for (const m of data ?? []) byId.set(m.id, m);
      } else if (segment.type === "department" && segment.id) {
        const { data } = await supabase
          .from("department_members")
          .select("members(id, first_name, last_name, user_id)")
          .eq("department_id", segment.id);
        for (const row of data ?? []) if (row.members) byId.set(row.members.id, row.members);
      } else if (segment.type === "site" && segment.id) {
        const { data } = await supabase
          .from("members")
          .select("id, first_name, last_name, user_id")
          .eq("organization_id", communication.organization_id)
          .eq("site_id", segment.id)
          .eq("member_status", "active");
        for (const m of data ?? []) byId.set(m.id, m);
      }
    }

    const recipients = [...byId.values()];

    if (communication.channel === "app") {
      const notifiable = recipients.filter((r): r is typeof r & { user_id: string } => Boolean(r.user_id));
      if (notifiable.length > 0) {
        await supabase.from("notifications").insert(
          notifiable.map((r) => ({
            organization_id: communication.organization_id,
            user_id: r.user_id,
            type: "communication",
            title: applyVariables(communication.title, r),
            body: applyVariables(communication.body, r),
            link: "/mon-espace/notifications",
            communication_id: communication.id,
          })),
        );
      }
    }

    await supabase
      .from("communications")
      .update({ status: "sent", sent_at: now, recipient_count: recipients.length })
      .eq("id", communication.id);

    dispatched += 1;
  }

  return NextResponse.json({ checked: due?.length ?? 0, dispatched });
}
