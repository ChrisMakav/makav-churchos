import { z } from "zod";

export const MEMBER_STATUSES = [
  "active",
  "visitor",
  "inactive",
  "transferred",
  "deceased",
] as const;

export const MEMBER_STATUS_OPTIONS = [
  { value: "active", label: "Actif" },
  { value: "visitor", label: "Visiteur" },
  { value: "inactive", label: "Inactif" },
  { value: "transferred", label: "Transféré" },
  { value: "deceased", label: "Décédé" },
] as const;

export const FAMILY_ROLES = ["head", "spouse", "child", "dependent", "other"] as const;

export const FAMILY_ROLE_OPTIONS = [
  { value: "head", label: "Chef de famille" },
  { value: "spouse", label: "Conjoint(e)" },
  { value: "child", label: "Enfant" },
  { value: "dependent", label: "Personne à charge" },
  { value: "other", label: "Autre" },
] as const;

export const GENDERS = ["male", "female", "other"] as const;

export const GENDER_OPTIONS = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" },
] as const;

export const memberFormSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis").max(100),
  lastName: z.string().trim().min(1, "Le nom est requis").max(100),
  email: z
    .union([z.literal(""), z.string().trim().email("Email invalide")])
    .optional()
    .transform((v) => (v ? v : null)),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : null)),
  birthDate: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  gender: z.enum(GENDERS).optional().nullable(),
  memberStatus: z.enum(MEMBER_STATUSES).default("active"),
  joinDate: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  familyId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  familyRole: z.enum(FAMILY_ROLES).optional().nullable(),
});

export type MemberFormValues = z.infer<typeof memberFormSchema>;

export const familyFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom de la famille est requis").max(150),
});
