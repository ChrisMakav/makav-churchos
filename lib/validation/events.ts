import { z } from "zod";

export const EVENT_STATUSES = ["scheduled", "cancelled", "completed"] as const;

export const EVENT_STATUS_OPTIONS = [
  { value: "scheduled", label: "Planifié" },
  { value: "cancelled", label: "Annulé" },
  { value: "completed", label: "Terminé" },
] as const;

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Le titre est requis").max(200),
    eventTypeId: z.string().min(1, "Le type d'événement est requis"),
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v ? v : null)),
    location: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v ? v : null)),
    roomId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    startsAt: z.string().min(1, "La date de début est requise"),
    endsAt: z.string().min(1, "La date de fin est requise"),
    departmentId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    capacity: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null)),
  })
  .refine((data) => new Date(data.endsAt) >= new Date(data.startsAt), {
    message: "La fin doit être après le début.",
    path: ["endsAt"],
  });

export const roomFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120),
  capacity: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null)),
});

export const serviceItemFormSchema = z.object({
  startsAt: z.string().min(1, "L'heure est requise"),
  title: z.string().trim().min(1, "Le titre est requis").max(200),
  ownerName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
});

export const registrationTrackFormSchema = z.object({
  label: z.string().trim().min(1, "Le libellé est requis").max(200),
  capacity: z
    .string()
    .min(1, "La capacité est requise")
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, "La capacité doit être positive"),
  registeredCount: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 0))
    .refine((v) => Number.isFinite(v) && v >= 0, "Le nombre d'inscrits doit être positif"),
});

export const registrationCountSchema = z
  .string()
  .min(1)
  .transform((v) => Number(v))
  .refine((v) => Number.isFinite(v) && v >= 0, "Doit être un nombre positif");
