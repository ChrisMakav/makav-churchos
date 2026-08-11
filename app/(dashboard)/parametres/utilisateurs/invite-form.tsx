"use client";

import { useActionState } from "react";
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
import { inviteMember, type InviteState } from "./actions";
import { P1_ROLE_OPTIONS } from "./roles";

const initialState: InviteState = {};

export function InviteForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, pending] = useActionState(
    inviteMember.bind(null, organizationId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="prenom.nom@eglise.org"
          required
          className="w-64"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Rôle</Label>
        <Select
          name="roleCode"
          defaultValue="member"
          items={P1_ROLE_OPTIONS.map((role) => ({ value: role.code, label: role.label }))}
        >
          <SelectTrigger id="invite-role" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {P1_ROLE_OPTIONS.map((role) => (
              <SelectItem key={role.code} value={role.code}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Inviter"}
      </Button>
      {state.error ? (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert className="w-full">
          <AlertDescription>Invitation envoyée.</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
