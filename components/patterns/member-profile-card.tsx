import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface MemberProfileData {
  fullName: string;
  photoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  statusLabel: string;
  birthDate?: string | null;
  joinDate?: string | null;
  genderLabel?: string | null;
  familyName?: string | null;
  familyRoleLabel?: string | null;
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export function MemberProfileCard({
  member,
  actions,
}: {
  member: MemberProfileData;
  actions?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {member.photoUrl ? <AvatarImage src={member.photoUrl} alt={member.fullName} /> : null}
            <AvatarFallback className="text-lg">{initialsFrom(member.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-heading text-2xl">{member.fullName}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {member.statusLabel}
            </Badge>
          </div>
        </div>
        {actions}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" value={member.email} />
        <Field label="Téléphone" value={member.phone} />
        <Field label="Date de naissance" value={member.birthDate} />
        <Field label="Genre" value={member.genderLabel} />
        <Field label="Date d'adhésion" value={member.joinDate} />
        <Field
          label="Famille"
          value={
            member.familyName
              ? `${member.familyName}${member.familyRoleLabel ? ` (${member.familyRoleLabel})` : ""}`
              : null
          }
        />
      </CardContent>
    </Card>
  );
}
