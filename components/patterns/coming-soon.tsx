import { Construction } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";

export function ComingSoon({ title, increment }: { title: string; increment: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <EmptyState
        icon={Construction}
        title="Module en construction"
        description={`Ce module sera disponible à l'${increment}.`}
      />
    </div>
  );
}
