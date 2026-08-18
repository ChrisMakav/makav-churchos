"use client";

import { useState, useTransition } from "react";
import { PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { createDonationFund, deleteDonationFund, updateDonationFund } from "../actions";

export interface FundRow {
  id: string;
  name: string;
  isRestricted: boolean;
  isActive: boolean;
  goalAmount: number | null;
  startsOn: string | null;
  endsOn: string | null;
}

function FundFormDialog({
  organizationId,
  fund,
  trigger,
}: {
  organizationId: string;
  fund?: FundRow;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(fund?.name ?? "");
  const [isRestricted, setIsRestricted] = useState(fund?.isRestricted ?? false);
  const [isActive, setIsActive] = useState(fund?.isActive ?? true);
  const [goalAmount, setGoalAmount] = useState(fund?.goalAmount != null ? String(fund.goalAmount) : "");
  const [startsOn, setStartsOn] = useState(fund?.startsOn ?? "");
  const [endsOn, setEndsOn] = useState(fund?.endsOn ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    const formData = new FormData();
    formData.set("name", name);
    if (isRestricted) formData.set("isRestricted", "on");
    if (isActive) formData.set("isActive", "on");
    formData.set("goalAmount", goalAmount);
    formData.set("startsOn", startsOn);
    formData.set("endsOn", endsOn);

    startTransition(async () => {
      try {
        if (fund) {
          await updateDonationFund(organizationId, fund.id, formData);
        } else {
          await createDonationFund(organizationId, formData);
          setName("");
          setGoalAmount("");
          setStartsOn("");
          setEndsOn("");
        }
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fund ? "Modifier le fonds" : "Nouveau fonds / projet"}</DialogTitle>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="fund-name">Nom</Label>
            <Input id="fund-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle salle" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fund-goal">Objectif de collecte (laisser vide pour une simple catégorie)</Label>
            <Input
              id="fund-goal"
              type="number"
              min={0}
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fund-starts">Début</Label>
              <Input id="fund-starts" type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fund-ends">Clôture</Label>
              <Input id="fund-ends" type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="fund-restricted"
              checked={isRestricted}
              onCheckedChange={(checked) => setIsRestricted(checked === true)}
            />
            <Label htmlFor="fund-restricted" className="font-normal">
              Fonds réservé (affectation restreinte)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="fund-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="fund-active" className="font-normal">
              Actif (visible dans le formulaire de don)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <Button disabled={!name.trim() || pending} onClick={submit}>
            {pending ? "Enregistrement…" : fund ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FundsManager({
  organizationId,
  currency,
  funds,
}: {
  organizationId: string;
  currency: string;
  funds: FundRow[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FundFormDialog
          organizationId={organizationId}
          trigger={
            <Button>
              <PlusIcon className="h-4 w-4" />
              Nouveau fonds
            </Button>
          }
        />
      </div>

      {funds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Aucun fonds. Les fonds par défaut (Dîme, Offrande, Missions) devraient exister — créez-en un
          nouveau avec un objectif pour lancer un projet de collecte.
        </p>
      ) : (
        <div className="space-y-2">
          {funds.map((fund) => (
            <div
              key={fund.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{fund.name}</p>
                  {!fund.isActive ? <Badge variant="outline">Inactif</Badge> : null}
                  {fund.isRestricted ? <Badge variant="secondary">Réservé</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {fund.goalAmount != null
                    ? `Objectif ${formatCurrency(fund.goalAmount, currency)}${fund.endsOn ? ` · clôture le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(fund.endsOn))}` : ""}`
                    : "Catégorie sans objectif"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <FundFormDialog
                  organizationId={organizationId}
                  fund={fund}
                  trigger={
                    <Button variant="ghost" size="icon-sm">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() => startTransition(() => deleteDonationFund(organizationId, fund.id))}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
