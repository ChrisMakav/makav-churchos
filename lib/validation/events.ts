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
