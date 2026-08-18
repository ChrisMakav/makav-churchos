import { z } from "zod";

export const CARPOOL_RIDE_STATUSES = [
  { value: "scheduled", label: "Programmé" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "cancelled", label: "Annulé" },
] as const;

export const CARPOOL_REQUEST_STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmée" },
  { value: "declined", label: "Refusée" },
  { value: "waitlisted", label: "Liste d'attente" },
  { value: "cancelled", label: "Annulée" },
] as const;

export const CARPOOL_INCIDENT_TYPES = [
  { value: "delay", label: "Retard" },
  { value: "no_show", label: "Absence" },
  { value: "conflict", label: "Conflit" },
  { value: "safety", label: "Sécurité" },
  { value: "vehicle_issue", label: "Problème véhicule" },
  { value: "other", label: "Autre" },
] as const;

export const MAX_RECURRING_OCCURRENCES = 26;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const optionalUuid = () =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

export const vehicleFormSchema = z.object({
  brand: z.string().trim().min(1, "La marque est requise").max(100),
  model: z.string().trim().min(1, "Le modèle est requis").max(100),
  color: optionalText(50),
  plateRaw: optionalText(20),
  seatCapacity: z.coerce.number().int().min(1, "Au moins 1 place").max(20),
  isPmrAccessible: z.coerce.boolean().default(false),
});

export const rideFormSchema = z
  .object({
    eventId: optionalUuid(),
    vehicleId: optionalUuid(),
    departureLabel: z.string().trim().min(1, "Le lieu de départ est requis").max(300),
    destinationLabel: z.string().trim().min(1, "La destination est requise").max(300),
    departsAt: z.string().min(1, "L'heure de départ est requise"),
    estimatedArrivalAt: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    seatCapacity: z.coerce.number().int().min(1, "Au moins 1 place").max(8),
    autoConfirm: z.coerce.boolean().default(false),
    acceptsChildren: z.coerce.boolean().default(true),
    acceptsLuggage: z.coerce.boolean().default(true),
    acceptsPets: z.coerce.boolean().default(false),
    nonSmoking: z.coerce.boolean().default(true),
    hasAirConditioning: z.coerce.boolean().default(false),
    isPmrAccessible: z.coerce.boolean().default(false),
    notes: optionalText(1000),
    recurrenceEnabled: z.coerce.boolean().default(false),
    recurrenceUntil: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine((d) => !d.estimatedArrivalAt || new Date(d.estimatedArrivalAt) > new Date(d.departsAt), {
    message: "L'arrivée estimée doit être après le départ.",
    path: ["estimatedArrivalAt"],
  })
  .refine((d) => !d.recurrenceEnabled || !!d.recurrenceUntil, {
    message: "Merci d'indiquer une date de fin de récurrence.",
    path: ["recurrenceUntil"],
  });

export const rideStopFormSchema = z.object({
  label: z.string().trim().min(1, "Le libellé est requis").max(200),
  address: optionalText(300),
  estimatedTime: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
});

export const seatRequestFormSchema = z.object({
  rideId: z.string().uuid(),
  seatsRequested: z.coerce.number().int().min(1, "Au moins 1 place").max(8),
  message: optionalText(500),
});

export const rideNeedFormSchema = z.object({
  eventId: optionalUuid(),
  departureLabel: z.string().trim().min(1, "Le lieu de départ est requis").max(300),
  neededBy: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  seatsNeeded: z.coerce.number().int().min(1, "Au moins 1 place").max(8),
  hasChildren: z.coerce.boolean().default(false),
  notes: optionalText(1000),
});

export const driverAvailabilityFormSchema = z.object({
  vehicleId: optionalUuid(),
  zones: optionalText(500),
  frequency: optionalText(200),
  notes: optionalText(1000),
  isActive: z.coerce.boolean().default(true),
});

export const incidentFormSchema = z.object({
  rideId: z.string().uuid(),
  incidentType: z.enum(["delay", "no_show", "conflict", "safety", "vehicle_issue", "other"]),
  description: z.string().trim().min(1, "Merci de décrire l'incident").max(2000),
});

// Masque tout sauf les 2 premiers et 2 derniers caractères — la plaque brute
// (plateRaw) n'est jamais insérée en base, uniquement ce résultat.
export function maskPlate(raw: string): string {
  const clean = raw.replace(/\s+/g, "").toUpperCase();
  if (clean.length <= 4) return "*".repeat(clean.length);
  return `${clean.slice(0, 2)}${"*".repeat(clean.length - 4)}${clean.slice(-2)}`;
}
