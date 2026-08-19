import "server-only";
import { headers } from "next/headers";

// Origine réelle de la requête en cours (prod, preview Vercel, ou localhost en
// dev) — utilisée pour construire des URLs absolues (ex. emailRedirectTo pour
// supabase.auth.signUp) qui ne doivent jamais pointer vers une autre appli.
// x-forwarded-* est posé par Vercel ; host/proto suffisent en local.
export async function getSiteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
