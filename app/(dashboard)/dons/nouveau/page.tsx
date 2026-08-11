import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { DonationForm } from "../donation-form";

export default async function NouveauDonPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: accounts }, { data: funds }, { data: members }, { data: org }] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("donation_funds").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase
      .from("members")
      .select("id, first_name, last_name")
      .eq("organization_id", organizationId)
      .order("first_name"),
    supabase.from("organizations").select("currency").eq("id", organizationId).single(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau don" />
      <DonationForm
        organizationId={organizationId}
        accounts={accounts ?? []}
        funds={funds ?? []}
        members={(members ?? []).map((m) => ({
          id: m.id,
          fullName: `${m.first_name} ${m.last_name}`,
        }))}
        defaultCurrency={org?.currency ?? "XAF"}
      />
    </div>
  );
}
