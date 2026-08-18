"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMemberPhone } from "../actions";

export function ProfilForm({ initialPhone }: { initialPhone: string | null }) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setSaved(false);
          }}
          placeholder="+237 6XX XXX XXX"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={pending || phone === (initialPhone ?? "")}
          onClick={() =>
            startTransition(async () => {
              await updateMemberPhone(phone);
              setSaved(true);
            })
          }
        >
          Enregistrer
        </Button>
        {saved ? <span className="text-xs text-muted-foreground">Enregistré.</span> : null}
      </div>
    </div>
  );
}
