import "server-only";
import { cookies } from "next/headers";
import { LOCALES, dictionaries, type DictionaryKey, type Locale } from "./dictionaries";

export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : "fr";
}

// Équivalent server-side de useTranslations() (lib/i18n/context.tsx, React
// context — inutilisable dans un Server Component) : pour les pages RSC déjà
// traduites (Tableau de bord, Membres pour l'instant).
export async function getDictionary() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return { locale, t: (key: DictionaryKey) => dict[key] ?? key };
}
