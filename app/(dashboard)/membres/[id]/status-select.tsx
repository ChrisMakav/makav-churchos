"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEMBER_STATUS_OPTIONS } from "@/lib/validation/members";
import { setMemberStatus } from "../actions";

export function StatusSelect({
  organizationId,
  memberId,
  status,
}: {
  organizationId: string;
  memberId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      key={status}
      defaultValue={status}
      disabled={pending}
      items={MEMBER_STATUS_OPTIONS}
      onValueChange={(value) => {
        if (value) startTransition(() => setMemberStatus(organizationId, memberId, value));
      }}
    >
      <SelectTrigger className="w-44">
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
  );
}
