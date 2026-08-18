import { createClient } from "@/lib/supabase/server";

export default async function BackofficeUtilisateursPage({
  searchParams,
}: PageProps<"/backoffice/utilisateurs">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q ?? "").trim();

  const supabase = await createClient();

  const { data: profiles } = query.length >= 2
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${query.replace(/[,()]/g, " ")}%,email.ilike.%${query.replace(/[,()]/g, " ")}%`)
        .limit(20)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

  const userIds = (profiles ?? []).map((p) => p.id);
  const { data: memberships } = userIds.length
    ? await supabase
        .from("memberships")
        .select("user_id, status, organizations(name), roles(label_fr)")
        .in("user_id", userIds)
    : { data: [] as { user_id: string | null; status: string; organizations: { name: string } | null; roles: { label_fr: string } | null }[] };

  const membershipsByUser = new Map<string, typeof memberships>();
  for (const m of memberships ?? []) {
    if (!m.user_id) continue;
    const list = membershipsByUser.get(m.user_id) ?? [];
    list.push(m);
    membershipsByUser.set(m.user_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-zinc-100">Utilisateurs</h1>
        <p className="text-sm text-zinc-400">Recherche tous organismes confondus — nom ou email.</p>
      </div>

      <form className="max-w-md">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Rechercher un utilisateur…"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
        />
      </form>

      {query.length < 2 ? (
        <p className="text-sm text-zinc-500">Tapez au moins 2 caractères pour rechercher.</p>
      ) : !profiles || profiles.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun résultat.</p>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
              <p className="text-sm font-medium text-zinc-100">{p.full_name || "—"}</p>
              <p className="text-xs text-zinc-500">{p.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(membershipsByUser.get(p.id) ?? []).map((m, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300"
                  >
                    {m.organizations?.name ?? "—"} · {m.roles?.label_fr ?? "—"}
                    {m.status !== "active" ? ` (${m.status})` : ""}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
