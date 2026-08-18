import { z } from "zod";

export const appointmentSlotFormSchema = z
  .object({
    pastorUserId: z.string().min(1, "Le pasteur est requis"),
    startsAt: z.string().min(1, "Le début est requis"),
    endsAt: z.string().min(1, "La fin est requise"),
    location: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "La fin doit être après le début.",
    path: ["endsAt"],
  });

export type AppointmentSlotFormValues = z.infer<typeof appointmentSlotFormSchema>;

export const appointmentRequestFormSchema = z.object({
  reason: z.string().trim().min(1, "Merci d'indiquer le motif de votre demande").max(1000),
});

export type AppointmentRequestFormValues = z.infer<typeof appointmentRequestFormSchema>;
