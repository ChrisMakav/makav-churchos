import { z } from "zod";

const NEW_CHILD_SENTINEL = "__new__";
const NO_EVENT_SENTINEL = "__none__";

export const checkinFormSchema = z
  .object({
    childMemberId: z.string().min(1, "L'enfant est requis"),
    newChildFirstName: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => (v ? v : null)),
    newChildLastName: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => (v ? v : null)),
    newChildBirthDate: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    eventId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    guardianName: z.string().trim().min(1, "Le nom du parent/tuteur est requis").max(150),
    guardianPhone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .transform((v) => (v ? v : null)),
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine(
    (data) => data.childMemberId !== NEW_CHILD_SENTINEL || Boolean(data.newChildFirstName && data.newChildLastName),
    { message: "Le prénom et le nom du nouvel enfant sont requis", path: ["newChildFirstName"] },
  );

export type CheckinFormValues = z.infer<typeof checkinFormSchema>;

export { NEW_CHILD_SENTINEL, NO_EVENT_SENTINEL };
