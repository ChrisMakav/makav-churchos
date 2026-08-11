"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_OPTIONS } from "@/lib/currencies";
import { updateOrganization, type OrganisationSettingsState } from "./actions";

const initialState: OrganisationSettingsState = {};

export function OrganisationForm({
  organizationId,
  name,
  currency,
  timezone,
}: {
  organizationId: string;
  name: string;
  currency: string;
  timezone: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateOrganization.bind(null, organizationId),
    initialState,
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert>
          <AlertDescription>Paramètres enregistrés.</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nom de l&apos;organisation</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Devise</Label>
        <Select name="currency" defaultValue={currency} items={CURRENCY_OPTIONS}>
          <SelectTrigger id="currency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Fuseau horaire</Label>
        <Input id="timezone" name="timezone" defaultValue={timezone} required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
