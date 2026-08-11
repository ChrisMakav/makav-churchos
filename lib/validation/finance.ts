import { z } from "zod";

export const ACCOUNT_TYPES = ["bank", "cash", "mobile_money"] as const;

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "bank", label: "Compte bancaire" },
  { value: "cash", label: "Caisse" },
  { value: "mobile_money", label: "Mobile money" },
] as const;

export const EXPENSE_STATUS_OPTIONS = [
  { value: "pending_approval", label: "En attente d'approbation" },
  { value: "approved", label: "Approuvée" },
  { value: "rejected", label: "Rejetée" },
  { value: "paid", label: "Payée" },
] as const;

const amountSchema = z
  .string()
  .min(1, "Le montant est requis")
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Montant invalide");

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(150),
  type: z.enum(ACCOUNT_TYPES),
  currency: z.string().trim().min(1).max(10),
  openingBalance: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 0)),
});

export const expenseFormSchema = z.object({
  vendor: z
    .string()
    .trim()
    .max(150)
    .optional()
    .transform((v) => (v ? v : null)),
  categoryId: z.string().min(1, "La catégorie est requise"),
  departmentId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  budgetLineId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  amount: amountSchema,
  currency: z.string().trim().min(1).max(10),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
});

export const incomeFormSchema = z.object({
  accountId: z.string().min(1, "Le compte est requis"),
  categoryId: z.string().min(1, "La catégorie est requise"),
  amount: amountSchema,
  currency: z.string().trim().min(1).max(10),
  occurredOn: z.string().min(1, "La date est requise"),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
});
