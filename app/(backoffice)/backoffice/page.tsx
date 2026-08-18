import { createClient } from "@/lib/supabase/server";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 font-heading text-4xl text-zinc-100">{value}</p>
    </div>
  );
}

export default async function BackofficeDashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: orgCount },
    { count: siteCount },
    { count: memberCount },
    { count: staffCount },
    { count: newOrgsThisWeek },
    { data: planRows },
  ] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("sites").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("organizations").select("plan"),
  ]);

  const planCounts = new Map<string, number>();
  for (const row of planRows ?? []) {
    planCounts.set(row.plan, (planCounts.get(row.plan) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-zinc-100">Vue d&apos;ensemble</h1>
        <p className="text-sm text-zinc-400">État global de la plateforme MAKAV ChurchOS.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Organisations" value={orgCount ?? 0} />
        <StatTile label="Sites & campus" value={siteCount ?? 0} />
        <StatTile label="Membres (toutes églises)" value={memberCount ?? 0} />
        <StatTile label="Comptes staff actifs" value={staffCount ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Nouvelles organisations (7 derniers jours)</p>
          <p className="mt-1 font-heading text-3xl text-zinc-100">{newOrgsThisWeek ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-3 text-sm text-zinc-400">Répartition par plan</p>
          <div className="space-y-1.5">
            {[...planCounts.entries()].map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between text-sm">
                <span className="capitalize text-zinc-300">{plan}</span>
                <span className="font-medium text-zinc-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
