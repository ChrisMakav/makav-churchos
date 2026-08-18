"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  id: string;
  category: "membres" | "dons" | "événements" | "groupes" | "départements";
  label: string;
  sublabel?: string;
  href: string;
}

// Recherche globale (en-tête dashboard) — quelques entités clés seulement
// (pas de moteur full-text dédié) : ilike sur les champs texte les plus
// consultés, 5 résultats par catégorie, RLS fait le filtrage par
// organisation comme pour toute autre requête.
export async function globalSearch(organizationId: string, query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  // "," et "()" cassent la syntaxe du filtre .or() de PostgREST — retirés
  // plutôt qu'échappés, une recherche reste utile sans ces caractères.
  const safe = trimmed.replace(/[,()]/g, " ").trim();
  if (!safe) return [];
  const like = `%${safe}%`;

  const [{ data: members }, { data: donations }, { data: events }, { data: groups }, { data: departments }] =
    await Promise.all([
      supabase
        .from("members")
        .select("id, first_name, last_name, email")
        .eq("organization_id", organizationId)
        .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`)
        .limit(5),
      supabase
        .from("donations")
        .select("id, receipt_number, amount, currency, members(first_name, last_name)")
        .eq("organization_id", organizationId)
        .ilike("receipt_number", like)
        .limit(5),
      supabase
        .from("events")
        .select("id, title, starts_at")
        .eq("organization_id", organizationId)
        .ilike("title", like)
        .limit(5),
      supabase
        .from("groups")
        .select("id, name")
        .eq("organization_id", organizationId)
        .ilike("name", like)
        .limit(5),
      supabase
        .from("departments")
        .select("id, name")
        .eq("organization_id", organizationId)
        .ilike("name", like)
        .limit(5),
    ]);

  const results: SearchResult[] = [];

  for (const m of members ?? []) {
    results.push({
      id: m.id,
      category: "membres",
      label: `${m.first_name} ${m.last_name}`,
      sublabel: m.email ?? undefined,
      href: `/membres/${m.id}`,
    });
  }
  for (const d of donations ?? []) {
    results.push({
      id: d.id,
      category: "dons",
      label: `Reçu ${d.receipt_number}`,
      sublabel: d.members ? `${d.members.first_name} ${d.members.last_name}` : undefined,
      href: `/dons/${d.id}`,
    });
  }
  for (const e of events ?? []) {
    results.push({
      id: e.id,
      category: "événements",
      label: e.title,
      sublabel: new Date(e.starts_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        timeZone: "UTC",
      }),
      href: `/evenements/${e.id}`,
    });
  }
  for (const g of groups ?? []) {
    results.push({ id: g.id, category: "groupes", label: g.name, href: `/groupes/${g.id}` });
  }
  for (const dep of departments ?? []) {
    results.push({ id: dep.id, category: "départements", label: dep.name, href: `/departements/${dep.id}` });
  }

  return results;
}
