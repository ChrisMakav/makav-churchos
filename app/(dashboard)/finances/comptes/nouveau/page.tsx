import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { AccountForm } from "./account-form";

export default async function NouveauComptePage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("currency")
    .eq("id", session.activeOrg.organizationId)
    .single();

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau compte" />
      <AccountForm
        organizationId={session.activeOrg.organizationId}
        defaultCurrency={org?.currency ?? "XAF"}
      />
    </div>
  );
}
