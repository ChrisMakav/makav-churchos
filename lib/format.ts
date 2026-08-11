// P1 ne gère qu'un fuseau horaire par organisation et pas de conversion
// multi-fuseau (voir docs/architecture/overview.md). Les champs
// <input type="datetime-local"> des formulaires (sans offset) sont stockés
// tels quels dans les colonnes timestamptz — Postgres les interprète en UTC.
// Pour que l'heure affichée soit identique à l'heure saisie quel que soit le
// fuseau du navigateur du lecteur, l'affichage force donc aussi `timeZone:
// "UTC"` plutôt que le fuseau local du navigateur.
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso));
}

// Convertit un timestamptz (ISO, ex. "2026-08-16T09:30:00+00:00") vers le
// format attendu par <input type="datetime-local"> ("2026-08-16T09:30"), en
// lisant les composantes UTC pour rester cohérent avec le stockage ci-dessus.
export function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

// Clé "yyyy-MM-dd" en UTC — cohérente avec le stockage timestamptz naïf
// décrit ci-dessus. À utiliser pour regrouper des événements par jour.
export function toUtcDayKey(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function toUtcTimeLabel(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
}
