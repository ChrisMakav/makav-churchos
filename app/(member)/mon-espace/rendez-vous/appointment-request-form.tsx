"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { bookAppointmentSlot, type AppointmentRequestFormState } from "./actions";

export function AppointmentRequestForm({ slotId }: { slotId: string }) {
  const [state, formAction, pending] = useActionState(
    bookAppointmentSlot.bind(null, slotId),
    {} as AppointmentRequestFormState,
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="reason">Motif de votre demande</Label>
        <Textarea
          id="reason"
          name="reason"
          rows={4}
          placeholder="Ce que vous souhaitez aborder avec le pasteur…"
          required
        />
        <p className="text-xs text-muted-foreground">
          Seul le pasteur concerné y aura accès, en toute confidentialité.
        </p>
        {state.fieldErrors?.reason ? (
          <p className="text-xs text-destructive">{state.fieldErrors.reason}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer la demande"}
      </Button>
    </form>
  );
}
