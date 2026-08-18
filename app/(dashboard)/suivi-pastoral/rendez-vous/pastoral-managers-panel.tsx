"use client";

import { useState, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeMemberRole } from "../../parametres/utilisateurs/actions";
import { addAppointmentManager, removeAppointmentManager } from "./actions";

export interface StaffOption {
  membershipId: string;
  userId: string;
  fullName: string;
  roleCode: string;
  roleLabel: string;
}

export interface ManagerRow {
  userId: string;
  fullName: string;
}

function PromotePastorForm({ candidates }: { candidates: StaffOption[] }) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");
  const items = candidates.map((c) => ({ value: c.membershipId, label: `${c.fullName} (${c.roleLabel})` }));

  if (candidates.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Définir comme pasteur</label>
        <Select items={items} value={selected} onValueChange={(v) => setSelected(v ?? "")}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Choisir un membre du staff" />
          </SelectTrigger>
          <SelectContent>
            {items.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        disabled={!selected || pending}
        onClick={() =>
          startTransition(async () => {
            await changeMemberRole(selected, "pastor");
            setSelected("");
          })
        }
      >
        Définir comme pasteur
      </Button>
    </div>
  );
}

function AddManagerForm({ candidates, organizationId }: { candidates: StaffOption[]; organizationId: string }) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");
  const items = candidates.map((c) => ({ value: c.userId, label: `${c.fullName} (${c.roleLabel})` }));

  if (candidates.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Ajouter un responsable</label>
        <Select items={items} value={selected} onValueChange={(v) => setSelected(v ?? "")}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Choisir un membre du staff" />
          </SelectTrigger>
          <SelectContent>
            {items.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        disabled={!selected || pending}
        onClick={() =>
          startTransition(async () => {
            await addAppointmentManager(organizationId, selected);
            setSelected("");
          })
        }
      >
        Ajouter comme responsable
      </Button>
    </div>
  );
}

export function PastoralManagersPanel({
  organizationId,
  staff,
  managers,
}: {
  organizationId: string;
  staff: StaffOption[];
  managers: ManagerRow[];
}) {
  const [pending, startTransition] = useTransition();

  const pastors = staff.filter((s) => s.roleCode === "pastor");
  const nonPastors = staff.filter((s) => s.roleCode !== "pastor");
  const managerUserIds = new Set(managers.map((m) => m.userId));
  const managerCandidates = staff.filter((s) => !managerUserIds.has(s.userId));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Pasteurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Un pasteur gère son propre agenda et apparaît dans la liste des rendez-vous proposés aux
            membres. Le définir comme pasteur remplace son rôle actuel.
          </p>
          {pastors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun pasteur pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {pastors.map((p) => (
                <div
                  key={p.membershipId}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <p className="text-sm font-medium text-foreground">{p.fullName}</p>
                </div>
              ))}
            </div>
          )}
          <PromotePastorForm candidates={nonPastors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Responsables des rendez-vous</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Un responsable peut gérer l&apos;agenda de tous les pasteurs (créer des créneaux, confirmer,
            annuler) sans devenir pasteur ni administrateur — utile pour un secrétariat pastoral.
          </p>
          {managers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun responsable pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {managers.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <p className="text-sm font-medium text-foreground">{m.fullName}</p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => removeAppointmentManager(organizationId, m.userId))
                    }
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <AddManagerForm candidates={managerCandidates} organizationId={organizationId} />
        </CardContent>
      </Card>
    </div>
  );
}
