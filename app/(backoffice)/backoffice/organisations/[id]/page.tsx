import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanSelect } from "./plan-select";

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm text-zinc-100">{value || "—"}</p>
    </div>
  );
}

export default async function BackofficeOrganisationDetailPage({
  params,
}: PageProps<"/backoffice/organisations/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, plan, currency, timezone, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!org) notFound();

  const [{ data: sites }, { data: memberCount }, { data: staff }] = await Promise.all([
    supabase.from("sites").select("id, name, type, is_active").eq("organization_id", id),
    supabase.from("members").select("id").eq("organization_id", id),
    supabase
      .from("memberships")
      .select("id, user_id, roles(label_fr)")
      .eq("organization_id", id)
      .eq("status", "active"),
  ]);

  // memberships.user_id et profiles.id référencent tous deux auth.users,
  // sans FK directe entre memberships et profiles — pas d'embed PostgREST
  // possible, jointure manuelle comme dans parametres/utilisateurs/page.tsx.
  const staffUserIds = (staff ?? []).map((m) => m.user_id).filter((v): v is string => Boolean(v));
  const { data: staffProfiles } = staffUserIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", staffUserIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const profileById = new Map((staffProfiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-zinc-100">{org.name}</h1>
        <p className="text-sm text-zinc-400">{org.slug}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoField label="Devise" value={org.currency} />
          <InfoField label="Fuseau horaire" value={org.timezone} />
          <InfoField
            label="Créée le"
            value={new Date(org.created_at).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
          />
          <InfoField label="Membres" value={String(memberCount?.length ?? 0)} />
        </div>
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <p className="mb-1.5 text-xs uppercase tracking-wide text-zinc-500">Plan</p>
          <PlanSelect organizationId={org.id} plan={org.plan} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="mb-3 text-sm font-medium text-zinc-100">Sites & campus</p>
        {!sites || sites.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun site.</p>
        ) : (
          <div className="space-y-1.5">
            {sites.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-200">{s.name}</span>
                <span className="text-xs text-zinc-500">
                  {s.type === "church" ? "Siège" : "Campus"} · {s.is_active ? "actif" : "inactif"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="mb-3 text-sm font-medium text-zinc-100">Équipe (comptes staff actifs)</p>
        {!staff || staff.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun compte staff.</p>
        ) : (
          <div className="space-y-1.5">
            {staff.map((m) => {
              const profile = m.user_id ? profileById.get(m.user_id) : undefined;
              return (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-200">{profile?.full_name ?? profile?.email ?? "—"}</span>
                  <span className="text-xs text-zinc-500">{m.roles?.label_fr ?? "—"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
