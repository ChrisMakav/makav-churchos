import { PageHeader } from "@/components/patterns/page-header";
import { getSession } from "@/lib/session";
import { GroupForm } from "../group-form";
import { createGroup } from "../actions";

export default async function NouveauGroupePage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau groupe" />
      <GroupForm
        action={createGroup.bind(null, session.activeOrg.organizationId)}
        submitLabel="Créer le groupe"
      />
    </div>
  );
}
