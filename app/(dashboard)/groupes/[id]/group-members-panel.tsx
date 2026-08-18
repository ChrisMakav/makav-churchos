"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { StarIcon, XIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GROUP_MEMBER_ROLE_OPTIONS } from "@/lib/validation/groups";
import { addGroupMember, removeGroupMember, setGroupLeader } from "../actions";

export interface GroupMemberRow {
  id: string;
  fullName: string;
  roleInGroup: string;
}

export interface AvailableMember {
  id: string;
  fullName: string;
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

const ROLE_LABEL = Object.fromEntries(GROUP_MEMBER_ROLE_OPTIONS.map((o) => [o.value, o.label]));

export function GroupMembersPanel({
  organizationId,
  groupId,
  leaderMemberId,
  members,
  availableMembers,
}: {
  organizationId: string;
  groupId: string;
  leaderMemberId: string | null;
  members: GroupMemberRow[];
  availableMembers: AvailableMember[];
}) {
  const [pending, startTransition] = useTransition();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");

  const memberItems = availableMembers.map((m) => ({ value: m.id, label: m.fullName }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun membre dans ce groupe.</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <Link href={`/membres/${member.id}`} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{initialsFrom(member.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{member.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABEL[member.roleInGroup] ?? member.roleInGroup}
                  </p>
                </div>
                {leaderMemberId === member.id ? (
                  <Badge variant="secondary">
                    <StarIcon className="h-3 w-3" />
                    Responsable
                  </Badge>
                ) : null}
              </Link>
              <div className="flex items-center gap-2">
                {leaderMemberId !== member.id ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => setGroupLeader(organizationId, groupId, member.id))
                    }
                  >
                    Définir comme responsable
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => removeGroupMember(organizationId, groupId, member.id))
                  }
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {availableMembers.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Ajouter un membre</label>
            <Select
              items={memberItems}
              value={selectedMemberId}
              onValueChange={(value) => setSelectedMemberId(value ?? "")}
            >
              <SelectTrigger className="w-56">
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
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Rôle</label>
            <Select
              items={GROUP_MEMBER_ROLE_OPTIONS}
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value ?? "member")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_MEMBER_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!selectedMemberId || pending}
            onClick={() =>
              startTransition(async () => {
                await addGroupMember(organizationId, groupId, selectedMemberId, selectedRole);
                setSelectedMemberId("");
              })
            }
          >
            Ajouter
          </Button>
        </div>
      ) : null}
    </div>
  );
}
