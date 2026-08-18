import { z } from "zod";

export const PASTORAL_CATEGORIES = [
  "visit",
  "call",
  "hospital",
  "counseling",
  "prayer_request",
  "other",
] as const;

export const PASTORAL_CATEGORY_OPTIONS = [
  { value: "visit", label: "Visite" },
  { value: "call", label: "Appel" },
  { value: "hospital", label: "Visite hôpital" },
  { value: "counseling", label: "Accompagnement" },
  { value: "prayer_request", label: "Demande de prière" },
  { value: "other", label: "Autre" },
] as const;

export const PASTORAL_STATUSES = ["open", "in_progress", "closed"] as const;

export const PASTORAL_STATUS_OPTIONS = [
  { value: "open", label: "Ouvert" },
  { value: "in_progress", label: "En cours" },
  { value: "closed", label: "Clos" },
] as const;

export const pastoralRecordFormSchema = z.object({
  memberId: z.string().min(1, "Le membre est requis"),
  category: z.enum(PASTORAL_CATEGORIES).default("visit"),
  notes: z.string().trim().min(1, "Une note est requise").max(4000),
  followUpDate: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
});

export type PastoralRecordFormValues = z.infer<typeof pastoralRecordFormSchema>;
