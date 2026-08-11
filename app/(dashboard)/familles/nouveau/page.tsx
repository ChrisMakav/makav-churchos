import { PageHeader } from "@/components/patterns/page-header";
import { getSession } from "@/lib/session";
import { FamilyCreateForm } from "./family-create-form";

export default async function NouvelleFamillePage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Nouvelle famille" />
      <FamilyCreateForm organizationId={session.activeOrg.organizationId} />
    </div>
  );
}
