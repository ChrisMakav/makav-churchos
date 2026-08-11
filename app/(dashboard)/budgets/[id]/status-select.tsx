"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUDGET_STATUS_OPTIONS } from "@/lib/validation/budgets";
import { setBudgetStatus } from "../actions";

export function StatusSelect({
  organizationId,
  budgetId,
  status,
}: {
  organizationId: string;
  budgetId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      key={status}
      defaultValue={status}
      disabled={pending}
      items={BUDGET_STATUS_OPTIONS}
      onValueChange={(value) => {
        if (value) startTransition(() => setBudgetStatus(organizationId, budgetId, value));
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BUDGET_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
