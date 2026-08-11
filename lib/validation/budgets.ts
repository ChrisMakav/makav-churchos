import { z } from "zod";

export const budgetFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(150),
  fiscalYear: z
    .string()
    .min(1, "L'année est requise")
    .refine((v) => !Number.isNaN(Number(v)), "Année invalide"),
});

export const budgetLineFormSchema = z.object({
  categoryId: z.string().min(1, "La catégorie est requise"),
  departmentId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  allocatedAmount: z
    .string()
    .min(1, "Le montant est requis")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Montant invalide"),
});

export const BUDGET_STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "active", label: "Actif" },
  { value: "closed", label: "Clôturé" },
] as const;
