"use client";

import { useTransition } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  addAssignedSlot,
  assignVolunteer,
  confirmSlot,
  createVacantSlot,
  deleteVacantSlot,
  unassignVolunteer,
} from "./actions";

export interface PoolMember {
  id: string;
  fullName: string;
}

export interface CellSlot {
  id: string;
  status: "vacant" | "pending" | "confirmed";
  member: { id: string; fullName: string } | null;
}

const AVATAR_TONES = [
  "bg-chart-1 text-white",
  "bg-chart-2 text-white",
  "bg-chart-3 text-white",
  "bg-chart-4 text-white",
  "bg-chart-5 text-white",
] as const;

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function toneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function MemberPicker({
  poolMembers,
  onPick,
  disabled,
}: {
  poolMembers: PoolMember[];
  onPick: (memberId: string) => void;
  disabled: boolean;
}) {
  if (poolMembers.length === 0) {
    return <p className="px-1 py-1.5 text-xs text-muted-foreground">Aucun bénévole dans cette équipe.</p>;
  }
  return (
    <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
      {poolMembers.map((member) => (
        <button
          key={member.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(member.id)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted disabled:opacity-50"
        >
          <Avatar size="sm" className={cn(toneFor(member.id))}>
            <AvatarFallback className="bg-transparent text-white">
              {initialsFrom(member.fullName)}
            </AvatarFallback>
          </Avatar>
          {member.fullName}
        </button>
      ))}
    </div>
  );
}

export function VolunteerCell({
  organizationId,
  departmentId,
  serviceDate,
  slots,
  poolMembers,
}: {
  organizationId: string;
  departmentId: string;
  serviceDate: string;
  slots: CellSlot[];
  poolMembers: PoolMember[];
}) {
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(slots.map((s) => s.member?.id).filter(Boolean));
  const availablePool = poolMembers.filter((m) => !assignedIds.has(m.id));

  return (
    <div className="flex flex-col gap-1.5">
      {slots.map((slot) =>
        slot.member ? (
          <DropdownMenu key={slot.id}>
            <DropdownMenuTrigger
              disabled={pending}
              className="flex items-center gap-2 rounded-lg border border-transparent bg-muted/60 px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:border-border disabled:pointer-events-none"
            >
              <Avatar size="sm" className={cn(toneFor(slot.member.id))}>
                <AvatarFallback className="bg-transparent text-white">
                  {initialsFrom(slot.member.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{slot.member.fullName}</span>
              {slot.status === "pending" ? (
                <span
                  className="ml-auto size-1.5 shrink-0 rounded-full bg-chart-4"
                  title="Confirmation en attente"
                />
              ) : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {slot.status === "pending" ? (
                <DropdownMenuItem
                  onClick={() =>
                    startTransition(() => confirmSlot(organizationId, slot.id))
                  }
                >
                  Confirmer
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  startTransition(() => unassignVolunteer(organizationId, slot.id))
                }
              >
                Retirer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Popover key={slot.id}>
            <div className="group/vacant relative">
              <PopoverTrigger
                disabled={pending}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-chart-1/50 px-2 py-1.5 text-xs font-medium text-chart-1 transition-colors hover:bg-chart-1/10 disabled:pointer-events-none"
              >
                <PlusIcon className="h-3 w-3" />
                Poste vacant
              </PopoverTrigger>
              <button
                type="button"
                aria-label="Supprimer ce poste"
                disabled={pending}
                onClick={() => startTransition(() => deleteVacantSlot(organizationId, slot.id))}
                className="absolute -top-1.5 -right-1.5 hidden size-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive/20 hover:text-destructive group-hover/vacant:flex"
              >
                <XIcon className="h-2.5 w-2.5" />
              </button>
            </div>
            <PopoverContent align="start" className="w-56">
              <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                Affecter un bénévole
              </p>
              <MemberPicker
                poolMembers={availablePool}
                disabled={pending}
                onPick={(memberId) =>
                  startTransition(() => assignVolunteer(organizationId, slot.id, memberId))
                }
              />
            </PopoverContent>
          </Popover>
        ),
      )}

      <Popover>
        <PopoverTrigger
          disabled={pending}
          className="flex items-center justify-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none"
        >
          <PlusIcon className="h-3 w-3" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56">
          <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
            Ajouter à ce créneau
          </p>
          <MemberPicker
            poolMembers={availablePool}
            disabled={pending}
            onPick={(memberId) =>
              startTransition(() => addAssignedSlot(organizationId, departmentId, serviceDate, memberId))
            }
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() => createVacantSlot(organizationId, departmentId, serviceDate))
            }
            className="mt-1 w-full rounded-md border-t border-border px-2 pt-1.5 text-left text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            + Marquer un poste vacant
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
