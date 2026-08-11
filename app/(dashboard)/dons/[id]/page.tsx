import Link from "next/link";
import { notFound } from "next/navigation";
import { ReceiptIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { DONATION_METHOD_OPTIONS } from "@/lib/validation/donations";

const METHOD_LABEL = Object.fromEntries(DONATION_METHOD_OPTIONS.map((o) => [o.value, o.label]));

export default async function DonationDetailPage({
  params,
}: PageProps<"/dons/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: donation } = await supabase
    .from("donations")
    .select(
      "id, amount, currency, method, given_at, is_anonymous, receipt_number, donation_funds(name), members(first_name, last_name)",
    )
    .eq("id", id)
    .eq("organization_id", session.activeOrg.organizationId)
    .maybeSingle();

  if (!donation) notFound();

  const donorName = donation.is_anonymous
    ? "Anonyme"
    : donation.members
      ? `${donation.members.first_name} ${donation.members.last_name}`
      : "Non renseigné";

  return (
    <div className="space-y-6">
      <PageHeader
        title={donorName}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/dons/${donation.id}/recu`} target="_blank" />}
            nativeButton={false}
          >
            <ReceiptIcon className="h-4 w-4" />
            Voir le reçu
          </Button>
        }
      />
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Montant</p>
            <p className="font-heading text-2xl text-foreground">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: donation.currency,
              }).format(Number(donation.amount))}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Fonds</p>
            <p className="text-sm text-foreground">{donation.donation_funds?.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Moyen</p>
            <p className="text-sm text-foreground">{METHOD_LABEL[donation.method]}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">N° de reçu</p>
            <p className="text-sm text-foreground">{donation.receipt_number}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
