// Aide partagée aux pages de rapports (app/(dashboard)/rapports/**) : découpage
// en mois calendaires pour les tendances sur 12 mois. Cohérent avec la
// convention "tout en UTC" documentée dans lib/format.ts — les colonnes
// `date` (occurred_on, given_at...) et `timestamptz` (starts_at, created_at...)
// renvoyées par PostgREST commencent toutes par "YYYY-MM", donc un simple
// slice(0, 7) suffit à en extraire la clé mensuelle sans reparser de fuseau.
export interface MonthBucket {
  key: string; // "2026-01"
  label: string; // "Janv. 26"
  start: string; // "2026-01-01" — borne inférieure incluse
  end: string; // "2026-02-01" — borne supérieure exclue
}

const MONTH_LABELS_FR = [
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
];

export function lastMonths(n: number, reference: Date = new Date()): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const pad = (x: number) => String(x).padStart(2, "0");

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - i, 1));
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    buckets.push({
      key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`,
      label: `${MONTH_LABELS_FR[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`,
      start: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`,
      end: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-01`,
    });
  }

  return buckets;
}

export function dateToMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function ageFromBirthDate(birthDate: string, reference: Date = new Date()): number {
  const birth = new Date(birthDate);
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = reference.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getUTCDate() < birth.getUTCDate())) {
    age--;
  }
  return age;
}

export const AGE_BRACKETS = [
  { label: "0-17 ans", min: 0, max: 17 },
  { label: "18-25 ans", min: 18, max: 25 },
  { label: "26-40 ans", min: 26, max: 40 },
  { label: "41-60 ans", min: 41, max: 60 },
  { label: "61 ans et +", min: 61, max: Infinity },
] as const;

// Échappe une valeur pour une ligne CSV (RFC 4180) : entoure de guillemets
// dès qu'elle contient un séparateur, un guillemet ou un saut de ligne.
export function toCsvValue(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(toCsvValue).join(";");
}
