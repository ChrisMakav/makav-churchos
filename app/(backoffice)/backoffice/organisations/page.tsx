import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BackofficeOrganisationsPage() {
  const supabase = await createClient();

  const [{ data: orgs }, { data: sites }, { data: members }] = await Promise.all([
    supabase.from("organizations").select("id, name, slug, plan, currency, created_at").order("created_at", { ascending: false }),
    supabase.from("sites").select("organization_id"),
    supabase.from("members").select("organization_id"),
  ]);

  const siteCountByOrg = new Map<string, number>();
  for (const s of sites ?? []) {
    siteCountByOrg.set(s.organization_id, (siteCountByOrg.get(s.organization_id) ?? 0) + 1);
  }
  const memberCountByOrg = new Map<string, number>();
  for (const m of members ?? []) {
    memberCountByOrg.set(m.organization_id, (memberCountByOrg.get(m.organization_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-zinc-100">Organisations</h1>
        <p className="text-sm text-zinc-400">{orgs?.length ?? 0} organisation{(orgs?.length ?? 0) > 1 ? "s" : ""}.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-xs text-zinc-400">
              <th className="px-4 py-2.5 font-medium">Organisation</th>
              <th className="px-4 py-2.5 font-medium">Plan</th>
              <th className="px-4 py-2.5 font-medium">Sites</th>
              <th className="px-4 py-2.5 font-medium">Membres</th>
              <th className="px-4 py-2.5 font-medium">Créée le</th>
            </tr>
          </thead>
          <tbody>
            {(orgs ?? []).map((org) => (
              <tr key={org.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-900/60">
                <td className="px-4 py-3">
                  <Link href={`/backoffice/organisations/${org.id}`} className="text-zinc-100 hover:underline">
                    {org.name}
                  </Link>
                  <p className="text-xs text-zinc-500">{org.slug}</p>
                </td>
                <td className="px-4 py-3 capitalize text-zinc-300">{org.plan}</td>
                <td className="px-4 py-3 text-zinc-300">{siteCountByOrg.get(org.id) ?? 0}</td>
                <td className="px-4 py-3 text-zinc-300">{memberCountByOrg.get(org.id) ?? 0}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {new Date(org.created_at).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
