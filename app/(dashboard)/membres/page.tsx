import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { getDictionary } from "@/lib/i18n/locale";
import { MembersList, type MemberRow } from "./members-list";

export default async function MembresPage() {
  const session = await getSession();
  if (!session) return null;
  const { t } = await getDictionary();

  const activeSiteName = session.siteOptions.find((s) => s.id === session.activeOrg.siteId)?.name;

  const supabase = await createClient();
  let query = supabase
    .from("members")
    .select(
      "id, first_name, last_name, email, phone, member_status, families!members_family_id_fkey(name)",
    )
    .eq("organization_id", session.activeOrg.organizationId)
    .order("last_name", { ascending: true });
  if (session.activeOrg.siteId) query = query.eq("site_id", session.activeOrg.siteId);
  const { data: members } = await query;

  const rows: MemberRow[] = (members ?? []).map((m) => ({
    id: m.id,
    fullName: `${m.first_name} ${m.last_name}`,
    email: m.email,
    phone: m.phone,
    status: m.member_status,
    familyName: m.families?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("membres.title")}
        description={`${rows.length} ${rows.length > 1 ? t("common.members") : t("common.member")}${activeSiteName ? ` · ${activeSiteName}` : ""}.`}
        actions={
          <Button render={<Link href="/membres/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            {t("membres.newMember")}
          </Button>
        }
      />
      <MembersList rows={rows} />
    </div>
  );
}
