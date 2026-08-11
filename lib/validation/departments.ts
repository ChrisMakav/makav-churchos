import { z } from "zod";

export const DEPARTMENT_MEMBER_ROLES = ["head", "assistant", "member"] as const;

export const DEPARTMENT_MEMBER_ROLE_OPTIONS = [
  { value: "head", label: "Responsable" },
  { value: "assistant", label: "Adjoint" },
  { value: "member", label: "Membre" },
] as const;

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(150),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
});
