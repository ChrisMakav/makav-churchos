"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { appointmentRequestFormSchema } from "@/lib/validation/pastoral-appointments";

export interface AppointmentRequestFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function bookAppointmentSlot(
  slotId: string,
  _prevState: AppointmentRequestFormState,
  formData: FormData,
): Promise<AppointmentRequestFormState> {
  const session = await getMemberSession();
  if (!session) return { error: "Session expirée." };

  const result = appointmentRequestFormSchema.safeParse({
    reason: String(formData.get("reason") ?? ""),
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Corrigez les champs indiqués.", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pastoral_appointment_slots")
    .update({
      member_id: session.member.id,
      reason: result.data.reason,
      status: "requested",
    })
    .eq("id", slotId)
    .eq("status", "open");

  if (error) return { error: "Ce créneau n'est plus disponible, choisissez-en un autre." };

  revalidatePath("/mon-espace/rendez-vous");
  redirect("/mon-espace/rendez-vous");
}

export async function cancelMyAppointment(slotId: string) {
  const session = await getMemberSession();
  if (!session) throw new Error("Session expirée");

  const supabase = await createClient();
  const { error } = await supabase
    .from("pastoral_appointment_slots")
    .update({ status: "open", member_id: null, reason: null })
    .eq("id", slotId)
    .eq("member_id", session.member.id)
    .in("status", ["requested", "confirmed"]);

  if (error) throw error;
  revalidatePath("/mon-espace/rendez-vous");
}
