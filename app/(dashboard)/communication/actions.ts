"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { ACTIVE_CHANNELS, sendCommunicationSchema, type SegmentInput } from "@/lib/validation/communications";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface RecipientMember {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string | null;
}

function applyVariables(template: string, member: Pick<RecipientMember, "first_name" | "last_name">) {
  return template.replaceAll("{prénom}", member.first_name).replaceAll("{nom}", member.last_name);
}

// Résout les segments choisis en une liste dédupliquée de membres — aucune
// table de segments n'est persistée (voir 0019_communication.sql), la
// résolution se fait à la volée à chaque envoi/programmation.
async function resolveRecipients(
  supabase: SupabaseServerClient,
  organizationId: string,
  segments: SegmentInput[],
): Promise<RecipientMember[]> {
  const byId = new Map<string, RecipientMember>();

  for (const segment of segments) {
    if (segment.type === "all") {
      const { data } = await supabase
        .from("members")
        .select("id, first_name, last_name, user_id")
        .eq("organization_id", organizationId)
        .eq("member_status", "active");
      for (const m of data ?? []) byId.set(m.id, m);
    } else if (segment.type === "department" && segment.id) {
      const { data } = await supabase
        .from("department_members")
        .select("members(id, first_name, last_name, user_id)")
        .eq("department_id", segment.id);
      for (const row of data ?? []) {
        if (row.members) byId.set(row.members.id, row.members);
      }
    } else if (segment.type === "site" && segment.id) {
      const { data } = await supabase
        .from("members")
        .select("id, first_name, last_name, user_id")
        .eq("organization_id", organizationId)
        .eq("site_id", segment.id)
        .eq("member_status", "active");
      for (const m of data ?? []) byId.set(m.id, m);
    }
  }

  return [...byId.values()];
}

async function dispatchApp(
  supabase: SupabaseServerClient,
  organizationId: string,
  communicationId: string,
  title: string,
  body: string,
  recipients: RecipientMember[],
) {
  // Seuls les membres avec un compte lié (portail membre) peuvent recevoir une
  // notification in-app — les autres comptent dans recipient_count (segment
  // réel) mais ne reçoivent rien tant qu'ils n'ont pas de compte, cohérent
  // avec relancerNonConfirmes (benevoles/actions.ts).
  const notifiable = recipients.filter((r): r is RecipientMember & { user_id: string } => Boolean(r.user_id));
  if (notifiable.length === 0) return;

  await supabase.from("notifications").insert(
    notifiable.map((r) => ({
      organization_id: organizationId,
      user_id: r.user_id,
      type: "communication",
      title: applyVariables(title, r),
      body: applyVariables(body, r),
      link: "/mon-espace/notifications",
      communication_id: communicationId,
    })),
  );
}

export interface SendCommunicationInput {
  channel: string;
  title: string;
  body: string;
  segments: SegmentInput[];
  scheduledAt: string | null;
}

export async function sendCommunication(organizationId: string, input: SendCommunicationInput) {
  await requirePermission(organizationId, "communications.write");

  const parsed = sendCommunicationSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  if (!ACTIVE_CHANNELS.includes(parsed.data.channel)) {
    throw new Error("Ce canal n'est pas encore disponible.");
  }

  const supabase = await createClient();
  const siteId = await getDefaultSiteId(organizationId);
  const recipients = await resolveRecipients(supabase, organizationId, parsed.data.segments);
  const segmentSummary = parsed.data.segments.map((s) => s.label).join(" · ");
  const isScheduled = Boolean(parsed.data.scheduledAt);

  const { data: communication, error } = await supabase
    .from("communications")
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      channel: parsed.data.channel,
      title: parsed.data.title,
      body: parsed.data.body,
      segment_summary: segmentSummary || "Aucun segment",
      segments: parsed.data.segments,
      recipient_count: recipients.length,
      status: isScheduled ? "scheduled" : "sent",
      scheduled_at: parsed.data.scheduledAt,
      sent_at: isScheduled ? null : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;

  if (!isScheduled && parsed.data.channel === "app") {
    await dispatchApp(
      supabase,
      organizationId,
      communication.id,
      parsed.data.title,
      parsed.data.body,
      recipients,
    );
  }

  revalidatePath("/communication");
}
