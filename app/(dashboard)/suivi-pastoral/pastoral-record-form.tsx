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
import { PASTORAL_CATEGORY_OPTIONS } from "@/lib/validation/pastoral-care";
import type { PastoralRecordFormState } from "./actions";

export interface MemberOption {
  id: string;
  fullName: string;
}

export function PastoralRecordForm({
  action,
  members,
  initialValues,
  submitLabel,
}: {
  action: (state: PastoralRecordFormState, formData: FormData) => Promise<PastoralRecordFormState>;
  members: MemberOption[];
  initialValues?: {
    memberId: string;
    category: string;
    notes: string;
    followUpDate: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const memberItems = members.map((m) => ({ value: m.id, label: m.fullName }));

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="memberId">Membre</Label>
        <Select name="memberId" defaultValue={initialValues?.memberId} items={memberItems}>
          <SelectTrigger id="memberId" className="w-full">
            <SelectValue placeholder="Choisir un membre" />
          </SelectTrigger>
          <SelectContent>
            {memberItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.memberId ? (
          <p className="text-xs text-destructive">{state.fieldErrors.memberId}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Select
          name="category"
          defaultValue={initialValues?.category ?? "visit"}
          items={PASTORAL_CATEGORY_OPTIONS}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PASTORAL_CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initialValues?.notes}
          rows={5}
          placeholder="Contexte, échanges, besoins exprimés…"
          required
        />
        {state.fieldErrors?.notes ? (
          <p className="text-xs text-destructive">{state.fieldErrors.notes}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="followUpDate">Date de relance (optionnel)</Label>
        <Input
          id="followUpDate"
          name="followUpDate"
          type="date"
          defaultValue={initialValues?.followUpDate}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
