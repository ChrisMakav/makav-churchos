"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createFamily, type FamilyFormState } from "../actions";

export function FamilyCreateForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, pending] = useActionState(
    createFamily.bind(null, organizationId),
    {} as FamilyFormState,
  );

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la famille</Label>
        <Input id="name" name="name" placeholder="Famille Mabila" required />
        {state.fieldErrors?.name ? (
          <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer la famille"}
      </Button>
    </form>
  );
}
