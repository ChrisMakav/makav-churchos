"use client";

import { useState, useTransition } from "react";
import { WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { markExpensePaid } from "../../actions";

export function PayDialog({
  organizationId,
  expenseId,
  accounts,
}: {
  organizationId: string;
  expenseId: string;
  accounts: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [pending, startTransition] = useTransition();

  const accountItems = accounts.map((a) => ({ value: a.id, label: a.name }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <WalletIcon className="h-4 w-4" />
            Marquer payée
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marquer la dépense payée</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Select items={accountItems} value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
            <SelectTrigger className="w-full">
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
        <DialogFooter>
          <Button
            disabled={!accountId || pending}
            onClick={() =>
              startTransition(async () => {
                await markExpensePaid(organizationId, expenseId, accountId);
                setOpen(false);
              })
            }
          >
            {pending ? "Enregistrement…" : "Confirmer le paiement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
