"use client";

import { useActionState, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIncomeTransaction, type FinanceFormState } from "../actions";

export interface AccountOption {
  id: string;
  name: string;
}
export interface CategoryOption {
  id: string;
  name: string;
}

export function IncomeDialog({
  organizationId,
  accounts,
  categories,
  defaultCurrency,
}: {
  organizationId: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
  defaultCurrency: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prevState: FinanceFormState, formData: FormData) => {
      const result = await createIncomeTransaction(organizationId, prevState, formData);
      if (!result.error) setOpen(false);
      return result;
    },
    {} as FinanceFormState,
  );

  const accountItems = accounts.map((a) => ({ value: a.id, label: a.name }));
  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><PlusIcon className="h-4 w-4" />Nouvelle recette</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle recette</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="accountId">Compte</Label>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Catégorie</Label>
            <Select name="categoryId" items={categoryItems}>
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Input id="currency" name="currency" defaultValue={defaultCurrency} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="occurredOn">Date</Label>
            <Input
              id="occurredOn"
              name="occurredOn"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
