import Link from "next/link";
import { CalendarDaysIcon, HandCoinsIcon, UsersIcon } from "lucide-react";
import { StatCard } from "@/components/patterns/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { formatCurrency } from "@/lib/format";

export default async function MonEspacePage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [{ data: org }, { data: donations }, { data: nextEvent }, { data: groupMembership }] =
    await Promise.all([
      supabase.from("organizations").select("currency").eq("id", session.member.organizationId).single(),
      supabase
        .from("donations")
        .select("amount")
        .eq("member_id", session.member.id)
        .gte("given_at", yearStart),
      supabase
        .from("events")
        .select("id, title, starts_at")
        .eq("organization_id", session.member.organizationId)
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("group_members")
        .select("groups(name)")
        .eq("member_id", session.member.id)
        .limit(1)
        .maybeSingle(),
    ]);

  const totalDonated = (donations ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const currency = org?.currency ?? "XAF";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">
          Bonjour {session.member.firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">{session.organizationName}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Dons cette année" value={formatCurrency(totalDonated, currency)} />
        <StatCard
          label="Prochain événement"
          value={nextEvent ? nextEvent.title : "—"}
          hint={
            nextEvent
              ? new Date(nextEvent.starts_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  timeZone: "UTC",
                })
              : undefined
          }
        />
        <StatCard label="Mon groupe" value={groupMembership?.groups?.name ?? "Aucun"} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/mon-espace/dons">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-2">
              <HandCoinsIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Mes dons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Historique et reçus de vos dons.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/mon-espace/evenements">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Événements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Les prochains rendez-vous de l&apos;église.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/mon-espace/groupe">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Mon groupe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Votre cellule ou petit groupe.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
