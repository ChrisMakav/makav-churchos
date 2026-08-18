import { z } from "zod";

export const GROUP_MEMBER_ROLES = ["leader", "assistant", "member"] as const;

export const GROUP_MEMBER_ROLE_OPTIONS = [
  { value: "leader", label: "Responsable" },
  { value: "assistant", label: "Adjoint" },
  { value: "member", label: "Membre" },
] as const;

export const GROUP_STATUSES = ["active", "inactive"] as const;

export const GROUP_STATUS_OPTIONS = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
] as const;

export const MEETING_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const MEETING_DAY_OPTIONS = [
  { value: "monday", label: "Lundi" },
  { value: "tuesday", label: "Mardi" },
  { value: "wednesday", label: "Mercredi" },
  { value: "thursday", label: "Jeudi" },
  { value: "friday", label: "Vendredi" },
  { value: "saturday", label: "Samedi" },
  { value: "sunday", label: "Dimanche" },
] as const;

export const groupFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(150),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
  meetingDay: z
    .union([z.enum(MEETING_DAYS), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  meetingTime: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  location: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform((v) => (v ? v : null)),
  capacity: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null)),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;
