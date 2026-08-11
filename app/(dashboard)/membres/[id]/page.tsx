import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberProfileCard } from "@/components/patterns/member-profile-card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import {
  FAMILY_ROLE_OPTIONS,
  GENDER_OPTIONS,
  MEMBER_STATUS_OPTIONS,
} from "@/lib/validation/members";
import { StatusSelect } from "./status-select";

function labelFor(options: readonly { value: string; label: string }[], value: string | null) {
  return options.find((o) => o.value === value)?.label ?? null;
}

export default async function MemberDetailPage({
  params,
}: PageProps<"/membres/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("members")
    .select(
      "id, first_name, last_name, email, phone, birth_date, gender, member_status, join_date, photo_url, family_role, families!members_family_id_fkey(name)",
    )
    .eq("id", id)
    .eq("organization_id", session.activeOrg.organizationId)
    .maybeSingle();

  if (!member) notFound();

  return (
    <div className="space-y-6">
      <MemberProfileCard
        member={{
          fullName: `${member.first_name} ${member.last_name}`,
          photoUrl: member.photo_url,
          email: member.email,
          phone: member.phone,
          statusLabel: labelFor(MEMBER_STATUS_OPTIONS, member.member_status) ?? member.member_status,
          birthDate: member.birth_date,
          joinDate: member.join_date,
          genderLabel: labelFor(GENDER_OPTIONS, member.gender),
          familyName: member.families?.name ?? null,
          familyRoleLabel: labelFor(FAMILY_ROLE_OPTIONS, member.family_role),
        }}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/membres/${member.id}/modifier`} />}
            nativeButton={false}
          >
            <PencilIcon className="h-4 w-4" />
            Modifier
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Changer le statut :</span>
        <StatusSelect
          organizationId={session.activeOrg.organizationId}
          memberId={member.id}
          status={member.member_status}
        />
      </div>
    </div>
  );
}
