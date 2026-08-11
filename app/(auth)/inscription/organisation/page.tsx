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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CURRENCY_OPTIONS } from "@/lib/currencies";
import { createOrganization, type OrganisationState } from "./actions";

const initialState: OrganisationState = {};

export default function OrganisationOnboardingPage() {
  const [state, formAction, pending] = useActionState(createOrganization, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Votre organisation</CardTitle>
        <CardDescription>
          Créez l&apos;espace de gestion de votre église. Vous pourrez ajouter des
          campus et inviter votre équipe ensuite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l&apos;église</Label>
            <Input id="name" name="name" placeholder="Église MAKAV" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Select name="currency" defaultValue="XAF" items={CURRENCY_OPTIONS}>
              <SelectTrigger id="currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input type="hidden" name="timezone" value="Africa/Douala" />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Création…" : "Créer l'organisation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
