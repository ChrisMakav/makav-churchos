import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { StatCard } from "@/components/patterns/stat-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { PastoralRecordsList, type PastoralRecordRow } from "./records-list";

export default async function SuiviPastoralPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: records } = await supabase
    .from("pastoral_records")
    .select("id, category, notes, status, follow_up_date, created_at, members(first_name, last_name)")
    .eq("organization_id", session.activeOrg.organizationId)
    .order("created_at", { ascending: false });

  const rows: PastoralRecordRow[] = (records ?? []).map((r) => ({
    id: r.id,
    memberName: r.members ? `${r.members.first_name} ${r.members.last_name}` : "—",
    category: r.category,
    notesExcerpt: r.notes,
    status: r.status,
    followUpDate: r.follow_up_date,
    createdAt: r.created_at,
  }));

  const openCount = rows.filter((r) => r.status === "open").length;
  const inProgressCount = rows.filter((r) => r.status === "in_progress").length;
  const closedCount = rows.filter((r) => r.status === "closed").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = rows.filter(
    (r) => r.followUpDate && r.followUpDate < today && r.status !== "closed",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi pastoral"
        description="Visites, appels et demandes de prière."
        actions={
          <Button render={<Link href="/suivi-pastoral/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouveau suivi
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ouverts" value={openCount} />
        <StatCard label="En cours" value={inProgressCount} />
        <StatCard label="Clos" value={closedCount} />
        <StatCard
          label="Relances en retard"
          value={overdueCount}
          hintTone={overdueCount > 0 ? "warning" : "neutral"}
        />
      </div>

      <PastoralRecordsList rows={rows} />
    </div>
  );
}
