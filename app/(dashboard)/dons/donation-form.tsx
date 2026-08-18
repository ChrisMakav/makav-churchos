"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DONATION_METHOD_OPTIONS } from "@/lib/validation/donations";
import { createDonation, type DonationFormState } from "./actions";

export interface AccountOption {
  id: string;
  name: string;
}
export interface FundOption {
  id: string;
  name: string;
}
export interface MemberOption {
  id: string;
  fullName: string;
}

const ANONYMOUS = "__anonymous__";

export function DonationForm({
  organizationId,
  accounts,
  funds,
  members,
  defaultCurrency,
}: {
  organizationId: string;
  accounts: AccountOption[];
  funds: FundOption[];
  members: MemberOption[];
  defaultCurrency: string;
}) {
  const [state, formAction, pending] = useActionState(
    createDonation.bind(null, organizationId),
    {} as DonationFormState,
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const accountItems = accounts.map((a) => ({ value: a.id, label: a.name }));
  const fundItems = funds.map((f) => ({ value: f.id, label: f.name }));
  const memberItems = [
    { value: ANONYMOUS, label: "Anonyme / non renseigné" },
    ...members.map((m) => ({ value: m.id, label: m.fullName })),
  ];

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="memberId">Donateur</Label>
        <Select name="memberId" defaultValue={ANONYMOUS} items={memberItems}>
          <SelectTrigger id="memberId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {memberItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isAnonymous"
          name="isAnonymous"
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked === true)}
        />
        <Label htmlFor="isAnonymous" className="font-normal">
          Ne pas afficher le nom du donateur (don anonyme)
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isRecurring"
          name="isRecurring"
          checked={isRecurring}
          onCheckedChange={(checked) => setIsRecurring(checked === true)}
        />
        <Label htmlFor="isRecurring" className="font-normal">
          Ce don fait partie d&apos;un engagement de don récurrent
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fundId">Fonds</Label>
        <Select name="fundId" items={fundItems}>
          <SelectTrigger id="fundId" className="w-full">
            <SelectValue placeholder="Choisir un fonds" />
          </SelectTrigger>
          <SelectContent>
            {fundItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.fundId ? (
          <p className="text-xs text-destructive">{state.fieldErrors.fundId}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountId">Compte de dépôt</Label>
        <Select name="accountId" items={accountItems}>
          <SelectTrigger id="accountId" className="w-full">
            <SelectValue placeholder="Choisir un compte" />
          </SelectTrigger>
          <SelectContent>
            {accountItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.accountId ? (
          <p className="text-xs text-destructive">{state.fieldErrors.accountId}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Montant</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
          {state.fieldErrors?.amount ? (
            <p className="text-xs text-destructive">{state.fieldErrors.amount}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <Input id="currency" name="currency" defaultValue={defaultCurrency} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Moyen</Label>
        <Select name="method" defaultValue="cash" items={DONATION_METHOD_OPTIONS}>
          <SelectTrigger id="method" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DONATION_METHOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="givenAt">Date</Label>
        <Input
          id="givenAt"
          name="givenAt"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le don"}
      </Button>
    </form>
  );
}
