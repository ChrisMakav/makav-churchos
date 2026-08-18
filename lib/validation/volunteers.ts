import { z } from "zod";

export const VOLUNTEER_SLOT_STATUSES = ["vacant", "pending", "confirmed"] as const;

export const assignVolunteerSchema = z.object({
  slotId: z.string().uuid(),
  memberId: z.string().uuid(),
});

export type AssignVolunteerValues = z.infer<typeof assignVolunteerSchema>;
