import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { DonationsList, type DonationRow } from "./donations-list";

export default async function DonsPage() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: donations } = await supabase
    .from("donations")
    .select(
      "id, amount, currency, given_at, is_anonymous, receipt_number, donation_funds(name), members(first_name, last_name)",
    )
    .eq("organization_id", session.activeOrg.organizationId)
    .order("given_at", { ascending: false });

  const rows: DonationRow[] = (donations ?? []).map((d) => ({
    id: d.id,
    donorName: d.is_anonymous
      ? "Anonyme"
      : d.members
        ? `${d.members.first_name} ${d.members.last_name}`
        : "Non renseigné",
    fundName: d.donation_funds?.name ?? "—",
    amount: Number(d.amount),
    currency: d.currency,
    givenAt: d.given_at,
    receiptNumber: d.receipt_number,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dons"
        description={`${rows.length} don${rows.length > 1 ? "s" : ""}.`}
        actions={
          <Button render={<Link href="/dons/nouveau" />} nativeButton={false}>
            <PlusIcon className="h-4 w-4" />
            Nouveau don
          </Button>
        }
      />
      <DonationsList rows={rows} />
    </div>
  );
}
