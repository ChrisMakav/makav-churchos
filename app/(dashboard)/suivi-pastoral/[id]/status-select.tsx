"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PASTORAL_STATUS_OPTIONS } from "@/lib/validation/pastoral-care";
import { setPastoralRecordStatus } from "../actions";

export function PastoralStatusSelect({
  organizationId,
  recordId,
  status,
}: {
  organizationId: string;
  recordId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      key={status}
      defaultValue={status}
      disabled={pending}
      items={PASTORAL_STATUS_OPTIONS}
      onValueChange={(value) => {
        if (value) startTransition(() => setPastoralRecordStatus(organizationId, recordId, value));
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PASTORAL_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
