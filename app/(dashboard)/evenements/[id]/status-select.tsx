"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_STATUS_OPTIONS } from "@/lib/validation/events";
import { setEventStatus } from "../actions";

export function StatusSelect({
  organizationId,
  eventId,
  status,
}: {
  organizationId: string;
  eventId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      key={status}
      defaultValue={status}
      disabled={pending}
      items={EVENT_STATUS_OPTIONS}
      onValueChange={(value) => {
        if (value) startTransition(() => setEventStatus(organizationId, eventId, value));
      }}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {EVENT_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
