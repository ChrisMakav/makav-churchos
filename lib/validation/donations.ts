import { z } from "zod";

export const DONATION_METHODS = ["cash", "check", "transfer", "card", "mobile_money"] as const;

export const DONATION_METHOD_OPTIONS = [
  { value: "cash", label: "Espèces" },
  { value: "check", label: "Chèque" },
  { value: "transfer", label: "Virement" },
  { value: "card", label: "Carte bancaire" },
  { value: "mobile_money", label: "Mobile money" },
] as const;

const amountSchema = z
  .string()
  .min(1, "Le montant est requis")
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Montant invalide");

export const donationFormSchema = z.object({
  accountId: z.string().min(1, "Le compte est requis"),
  fundId: z.string().min(1, "Le fonds est requis"),
  memberId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  amount: amountSchema,
  currency: z.string().trim().min(1).max(10),
  method: z.enum(DONATION_METHODS),
  givenAt: z.string().min(1, "La date est requise"),
  isAnonymous: z.boolean().default(false),
});
