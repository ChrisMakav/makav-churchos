"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSite, type SiteFormState } from "./actions";

const initialState: SiteFormState = {};

export function SiteForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, pending] = useActionState(createSite.bind(null, organizationId), initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      {state.error ? (
        <div className="w-full">
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <div className="min-w-40 flex-1 space-y-1.5">
        <Label htmlFor="name" className="text-xs text-muted-foreground">
          Nom du campus
        </Label>
        <Input id="name" name="name" placeholder="Campus Nord" required />
      </div>
      <div className="min-w-40 flex-1 space-y-1.5">
        <Label htmlFor="address" className="text-xs text-muted-foreground">
          Adresse
        </Label>
        <Input id="address" name="address" />
      </div>
      <div className="min-w-32 space-y-1.5">
        <Label htmlFor="city" className="text-xs text-muted-foreground">
          Ville
        </Label>
        <Input id="city" name="city" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Ajouter un campus"}
      </Button>
    </form>
  );
}
