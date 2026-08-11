import { PageHeader } from "@/components/patterns/page-header";
import { getSession } from "@/lib/session";
import { DepartmentForm } from "../department-form";
import { createDepartment } from "../actions";

export default async function NouveauDepartementPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Nouveau département" />
      <DepartmentForm
        action={createDepartment.bind(null, session.activeOrg.organizationId)}
        submitLabel="Créer le département"
      />
    </div>
  );
}
