"use client";

import { useTransition } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHasPermission } from "@/lib/rbac/context";
import { approveExpense } from "../../actions";

export function ExpenseActions({
  organizationId,
  expenseId,
}: {
  organizationId: string;
  expenseId: string;
}) {
  const [pending, startTransition] = useTransition();
  const canApprove = useHasPermission("finance.expenses.approve");

  if (!canApprove) return null;

  return (
    <div className="flex gap-2">
      <Button
        disabled={pending}
        onClick={() => startTransition(() => approveExpense(organizationId, expenseId, true))}
      >
        <CheckIcon className="h-4 w-4" />
        Approuver
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(() => approveExpense(organizationId, expenseId, false))}
      >
        <XIcon className="h-4 w-4" />
        Rejeter
      </Button>
    </div>
  );
}
