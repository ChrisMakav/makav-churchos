"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createBudget, type BudgetFormState } from "../actions";

export function BudgetCreateForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, pending] = useActionState(
    createBudget.bind(null, organizationId),
    {} as BudgetFormState,
  );

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" placeholder="Budget annuel" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fiscalYear">Exercice</Label>
        <Input
          id="fiscalYear"
          name="fiscalYear"
          type="number"
          defaultValue={new Date().getFullYear()}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le budget"}
      </Button>
    </form>
  );
}
