import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { SiteForm } from "./site-form";
import { SiteRow } from "./site-row";

export default async function SitesPage() {
  const session = await getSession();
  if (!session) return null;

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const [{ data: sites }, { data: members }] = await Promise.all([
    supabase
      .from("sites")
      .select("id, name, type, address, is_active, parent_site_id")
      .eq("organization_id", organizationId)
      .order("created_at"),
    supabase.from("members").select("site_id").eq("organization_id", organizationId),
  ]);

  const countBySite = new Map<string, number>();
  for (const row of members ?? []) {
    countBySite.set(row.site_id, (countBySite.get(row.site_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sites & campus"
        description="Gérez les campus de votre église. Le sélecteur en haut de la barre latérale permet de basculer entre eux."
      />

      <div className="space-y-2">
        {(sites ?? []).map((site) => (
          <SiteRow
            key={site.id}
            organizationId={organizationId}
            siteId={site.id}
            name={site.name}
            type={site.type}
            address={site.address}
            memberCount={countBySite.get(site.id) ?? 0}
            isActive={site.is_active}
            isRoot={site.parent_site_id === null}
          />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Ajouter un campus</p>
        <SiteForm organizationId={organizationId} />
      </div>
    </div>
  );
}
