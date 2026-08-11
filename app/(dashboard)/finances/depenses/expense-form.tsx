"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExpense, type FinanceFormState } from "../actions";

export interface CategoryOption {
  id: string;
  name: string;
}
export interface DepartmentOption {
  id: string;
  name: string;
}
export interface BudgetLineOption {
  id: string;
  label: string;
}

const NO_DEPARTMENT = "__none__";
const NO_BUDGET_LINE = "__none__";

export function ExpenseForm({
  organizationId,
  categories,
  departments,
  budgetLines = [],
  defaultCurrency,
}: {
  organizationId: string;
  categories: CategoryOption[];
  departments: DepartmentOption[];
  budgetLines?: BudgetLineOption[];
  defaultCurrency: string;
}) {
  const [state, formAction, pending] = useActionState(
    createExpense.bind(null, organizationId),
    {} as FinanceFormState,
  );

  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));
  const departmentItems = [
    { value: NO_DEPARTMENT, label: "Aucun" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];
  const budgetLineItems = [
    { value: NO_BUDGET_LINE, label: "Aucune" },
    ...budgetLines.map((b) => ({ value: b.id, label: b.label })),
  ];

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="vendor">Fournisseur</Label>
        <Input id="vendor" name="vendor" />
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
        {state.fieldErrors?.categoryId ? (
          <p className="text-xs text-destructive">{state.fieldErrors.categoryId}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="departmentId">Département</Label>
        <Select name="departmentId" defaultValue={NO_DEPARTMENT} items={departmentItems}>
          <SelectTrigger id="departmentId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departmentItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {budgetLines.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="budgetLineId">Ligne budgétaire</Label>
          <Select name="budgetLineId" defaultValue={NO_BUDGET_LINE} items={budgetLineItems}>
            <SelectTrigger id="budgetLineId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {budgetLineItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
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
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Soumettre pour approbation"}
      </Button>
    </form>
  );
}
