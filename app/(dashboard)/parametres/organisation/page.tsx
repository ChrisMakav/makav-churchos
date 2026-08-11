import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { OrganisationForm } from "./organisation-form";

export default async function OrganisationSettingsPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, currency, timezone")
    .eq("id", session.activeOrg.organizationId)
    .single();

  if (!organization) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres de l'organisation"
        description="Informations générales de votre église."
      />
      <OrganisationForm
        organizationId={organization.id}
        name={organization.name}
        currency={organization.currency}
        timezone={organization.timezone}
      />
    </div>
  );
}
