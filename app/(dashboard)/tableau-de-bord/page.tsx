import Link from "next/link";
import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { EmptyState } from "@/components/patterns/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatCurrency } from "@/lib/format";

export default async function TableauDeBordPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const nowIso = now.toISOString();

  const [
    { count: activeMembersCount },
    { data: monthDonations },
    { data: upcomingEvents },
    { count: pendingExpensesCount },
    { data: org },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("member_status", "active"),
    supabase
      .from("donations")
      .select("amount")
      .eq("organization_id", organizationId)
      .gte("given_at", monthStart),
    supabase
      .from("events")
      .select("id, title, starts_at, location")
      .eq("organization_id", organizationId)
      .eq("status", "scheduled")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(5),
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending_approval"),
    supabase.from("organizations").select("name, currency").eq("id", organizationId).single(),
  ]);

  const currency = org?.currency ?? "XAF";
  const donationsTotal = (monthDonations ?? []).reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description={`Vue d'ensemble de ${org?.name ?? ""}.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Membres actifs" value={activeMembersCount ?? 0} />
        <StatCard label="Dons du mois" value={formatCurrency(donationsTotal, currency)} />
        <StatCard label="Événements à venir" value={upcomingEvents?.length ?? 0} />
        <StatCard
          label="Dépenses à approuver"
          value={pendingExpensesCount ?? 0}
          hint={pendingExpensesCount ? "Nécessite votre attention" : undefined}
          hintTone="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Prochains événements</CardTitle>
        </CardHeader>
        <CardContent>
          {!upcomingEvents || upcomingEvents.length === 0 ? (
            <EmptyState
              title="Aucun événement planifié"
              description="Créez votre prochain culte ou réunion depuis le module Événements."
            />
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/evenements/${event.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.location || "—"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    }).format(new Date(event.starts_at))}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
