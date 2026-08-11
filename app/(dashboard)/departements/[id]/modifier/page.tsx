import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { DepartmentForm } from "../../department-form";
import { updateDepartment } from "../../actions";

export default async function ModifierDepartementPage({
  params,
}: PageProps<"/departements/[id]/modifier">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: department } = await supabase
    .from("departments")
    .select("id, name, description")
    .eq("id", id)
    .eq("organization_id", session.activeOrg.organizationId)
    .maybeSingle();

  if (!department) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Modifier ${department.name}`} />
      <DepartmentForm
        action={updateDepartment.bind(null, session.activeOrg.organizationId, department.id)}
        initialValues={{ name: department.name, description: department.description ?? "" }}
        submitLabel="Enregistrer"
      />
    </div>
  );
}
