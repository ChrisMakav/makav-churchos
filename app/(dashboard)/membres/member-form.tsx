"use client";

import { useActionState, useState } from "react";
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
import {
  FAMILY_ROLE_OPTIONS,
  GENDER_OPTIONS,
  MEMBER_STATUS_OPTIONS,
} from "@/lib/validation/members";
import type { MemberFormState } from "./actions";

export interface FamilyOption {
  id: string;
  name: string;
}

export interface MemberFormInitialValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  memberStatus: string;
  joinDate: string;
  familyId: string;
  familyRole: string;
}

const EMPTY_VALUES: MemberFormInitialValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  gender: "",
  memberStatus: "active",
  joinDate: "",
  familyId: "",
  familyRole: "",
};

const NO_FAMILY = "__none__";

export function MemberForm({
  action,
  families,
  initialValues = EMPTY_VALUES,
  submitLabel,
}: {
  action: (state: MemberFormState, formData: FormData) => Promise<MemberFormState>;
  families: FamilyOption[];
  initialValues?: MemberFormInitialValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [familyId, setFamilyId] = useState(initialValues.familyId);

  const familyItems = [
    { value: NO_FAMILY, label: "Aucune famille" },
    ...families.map((f) => ({ value: f.id, label: f.name })),
  ];

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" name="firstName" defaultValue={initialValues.firstName} required />
          {state.fieldErrors?.firstName ? (
            <p className="text-xs text-destructive">{state.fieldErrors.firstName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" name="lastName" defaultValue={initialValues.lastName} required />
          {state.fieldErrors?.lastName ? (
            <p className="text-xs text-destructive">{state.fieldErrors.lastName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={initialValues.email} />
          {state.fieldErrors?.email ? (
            <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" defaultValue={initialValues.phone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Date de naissance</Label>
          <Input id="birthDate" name="birthDate" type="date" defaultValue={initialValues.birthDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Genre</Label>
          <Select name="gender" defaultValue={initialValues.gender} items={GENDER_OPTIONS}>
            <SelectTrigger id="gender" className="w-full">
              <SelectValue placeholder="Non renseigné" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="memberStatus">Statut</Label>
          <Select
            name="memberStatus"
            defaultValue={initialValues.memberStatus}
            items={MEMBER_STATUS_OPTIONS}
          >
            <SelectTrigger id="memberStatus" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEMBER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="joinDate">Date d&apos;adhésion</Label>
          <Input id="joinDate" name="joinDate" type="date" defaultValue={initialValues.joinDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="familyId">Famille</Label>
          <Select
            name="familyId"
            defaultValue={initialValues.familyId || NO_FAMILY}
            items={familyItems}
            onValueChange={(value) => setFamilyId(value === NO_FAMILY ? "" : (value ?? ""))}
          >
            <SelectTrigger id="familyId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {familyItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {familyId ? (
          <div className="space-y-2">
            <Label htmlFor="familyRole">Rôle dans la famille</Label>
            <Select
              name="familyRole"
              defaultValue={initialValues.familyRole || "other"}
              items={FAMILY_ROLE_OPTIONS}
            >
              <SelectTrigger id="familyRole" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FAMILY_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
