import { z } from "zod";

const attendanceCountSchema = z
  .string()
  .min(1)
  .transform((v) => Number(v))
  .refine((v) => Number.isInteger(v) && v >= 0, "Doit être un nombre entier positif");

export const attendanceFormSchema = z.object({
  eventId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  serviceDate: z.string().min(1, "La date est requise"),
  label: z.string().trim().min(1, "Le libellé est requis").max(150),
  womenCount: attendanceCountSchema,
  menCount: attendanceCountSchema,
  teensCount: attendanceCountSchema,
  childrenCount: attendanceCountSchema,
  newPeopleCount: attendanceCountSchema,
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
});

export type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

export const NO_EVENT_SENTINEL = "__none__";
