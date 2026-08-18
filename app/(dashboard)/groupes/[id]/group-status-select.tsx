"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GROUP_STATUS_OPTIONS } from "@/lib/validation/groups";
import { setGroupStatus } from "../actions";

export function GroupStatusSelect({
  organizationId,
  groupId,
  status,
}: {
  organizationId: string;
  groupId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      key={status}
      defaultValue={status}
      disabled={pending}
      items={GROUP_STATUS_OPTIONS}
      onValueChange={(value) => {
        if (value) startTransition(() => setGroupStatus(organizationId, groupId, value));
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {GROUP_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
