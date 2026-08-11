import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const THRESHOLDS = [100, 90, 70] as const;

// Vercel Cron (quotidien, voir vercel.ts) — calcule le pourcentage consommé de
// chaque ligne budgétaire active et notifie une fois par seuil franchi
// (idempotence via budget_alerts_sent, contrainte unique (budget_line_id,
// threshold)). Utilise le client service-role : ce job n'est rattaché à
// aucun utilisateur, il doit voir toutes les organisations.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();

  const { data: lines, error: linesError } = await supabase
    .from("budget_lines")
    .select("id, allocated_amount, category_id, budgets!inner(organization_id, status)")
    .eq("budgets.status", "active")
    .gt("allocated_amount", 0);

  if (linesError) {
    return NextResponse.json({ error: linesError.message }, { status: 500 });
  }

  const lineIds = (lines ?? []).map((l) => l.id);
  if (lineIds.length === 0) {
    return NextResponse.json({ checked: 0, alertsSent: 0 });
  }

  const { data: actuals } = await supabase
    .from("budget_line_actuals")
    .select("budget_line_id, spent_amount")
    .in("budget_line_id", lineIds);
  const spentByLine = new Map((actuals ?? []).map((a) => [a.budget_line_id, Number(a.spent_amount)]));

  const { data: alreadySent } = await supabase
    .from("budget_alerts_sent")
    .select("budget_line_id, threshold")
    .in("budget_line_id", lineIds);
  const sentSet = new Set((alreadySent ?? []).map((a) => `${a.budget_line_id}:${a.threshold}`));

  const { data: budgetsPermission } = await supabase
    .from("permissions")
    .select("id")
    .eq("code", "budgets.write")
    .single();
  const { data: rolesWithPermission } = budgetsPermission
    ? await supabase.from("role_permissions").select("role_id").eq("permission_id", budgetsPermission.id)
    : { data: [] as { role_id: string }[] };
  const budgetManagerRoleIds = (rolesWithPermission ?? []).map((r) => r.role_id);

  let alertsSent = 0;

  for (const line of lines ?? []) {
    const spent = spentByLine.get(line.id) ?? 0;
    const allocated = Number(line.allocated_amount);
    const pct = (spent / allocated) * 100;
    const organizationId = line.budgets.organization_id;

    const thresholdCrossed = THRESHOLDS.find(
      (t) => pct >= t && !sentSet.has(`${line.id}:${t}`),
    );
    if (!thresholdCrossed) continue;

    const { error: insertAlertError } = await supabase
      .from("budget_alerts_sent")
      .insert({ budget_line_id: line.id, threshold: thresholdCrossed });
    if (insertAlertError) continue; // conflit = déjà envoyé entre-temps, on passe

    const { data: recipients } = budgetManagerRoleIds.length
      ? await supabase
          .from("memberships")
          .select("user_id")
          .eq("organization_id", organizationId)
          .eq("status", "active")
          .in("role_id", budgetManagerRoleIds)
      : { data: [] as { user_id: string | null }[] };

    const userIds = (recipients ?? [])
      .map((m) => m.user_id)
      .filter((uid): uid is string => Boolean(uid));

    if (userIds.length > 0) {
      await supabase.from("notifications").insert(
        userIds.map((userId) => ({
          organization_id: organizationId,
          user_id: userId,
          type: "budget_alert",
          title: `Budget à ${thresholdCrossed} %`,
          body: `Une ligne budgétaire a atteint ${Math.round(pct)} % de son allocation.`,
          link: `/budgets`,
        })),
      );
    }

    alertsSent += 1;
  }

  return NextResponse.json({ checked: lines?.length ?? 0, alertsSent });
}
