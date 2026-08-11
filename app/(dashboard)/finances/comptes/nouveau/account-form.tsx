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
import { ACCOUNT_TYPE_OPTIONS } from "@/lib/validation/finance";
import { createAccount, type FinanceFormState } from "../../actions";

export function AccountForm({
  organizationId,
  defaultCurrency,
}: {
  organizationId: string;
  defaultCurrency: string;
}) {
  const [state, formAction, pending] = useActionState(
    createAccount.bind(null, organizationId),
    {} as FinanceFormState,
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" placeholder="Caisse principale" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select name="type" defaultValue="bank" items={ACCOUNT_TYPE_OPTIONS}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Devise</Label>
        <Input id="currency" name="currency" defaultValue={defaultCurrency} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="openingBalance">Solde initial</Label>
        <Input id="openingBalance" name="openingBalance" type="number" step="0.01" defaultValue="0" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le compte"}
      </Button>
    </form>
  );
}
