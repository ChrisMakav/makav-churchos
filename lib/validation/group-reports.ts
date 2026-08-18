import { z } from "zod";

const groupReportCountSchema = z
  .string()
  .min(1)
  .transform((v) => Number(v))
  .refine((v) => Number.isInteger(v) && v >= 0, "Doit être un nombre entier positif");

export const groupReportFormSchema = z.object({
  meetingDate: z.string().min(1, "La date est requise"),
  theme: z.string().trim().min(1, "Le thème est requis").max(200),
  womenCount: groupReportCountSchema,
  menCount: groupReportCountSchema,
  teensCount: groupReportCountSchema,
  childrenCount: groupReportCountSchema,
  newPeopleCount: groupReportCountSchema,
  newBirthsCount: groupReportCountSchema,
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
});

export type GroupReportFormValues = z.infer<typeof groupReportFormSchema>;
