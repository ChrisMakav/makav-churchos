import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { PrintButton } from "./print-button";

export default async function RecuDonPage({ params }: PageProps<"/dons/[id]/recu">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: donation }, { data: organization }] = await Promise.all([
    supabase
      .from("donations")
      .select(
        "id, amount, currency, given_at, is_anonymous, receipt_number, receipt_issued_at, donation_funds(name), members(first_name, last_name, email)",
      )
      .eq("id", id)
      .eq("organization_id", session.activeOrg.organizationId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("name")
      .eq("id", session.activeOrg.organizationId)
      .single(),
  ]);

  if (!donation) notFound();

  const donorName = donation.is_anonymous
    ? "Anonyme"
    : donation.members
      ? `${donation.members.first_name} ${donation.members.last_name}`
      : "Non renseigné";

  return (
    <main className="mx-auto max-w-2xl space-y-6 bg-background px-6 py-12 print:px-0 print:py-0">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="space-y-8 rounded-xl border border-border bg-card p-10 print:border-none print:p-0">
        <header className="space-y-1 border-b border-border pb-6">
          <p className="font-heading text-2xl text-foreground">{organization?.name}</p>
          <p className="text-sm text-muted-foreground">Reçu de don n° {donation.receipt_number}</p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Donateur</p>
            <p className="text-sm text-foreground">{donorName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Date du don</p>
            <p className="text-sm text-foreground">
              {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
                new Date(donation.given_at),
              )}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Fonds</p>
            <p className="text-sm text-foreground">{donation.donation_funds?.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Montant</p>
            <p className="font-heading text-2xl text-foreground">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: donation.currency,
              }).format(Number(donation.amount))}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-warning bg-warning/10 p-4 text-xs text-foreground">
          <strong>Modèle provisoire.</strong> Le texte légal obligatoire (mentions fiscales,
          statut de l&apos;organisation, base légale de déductibilité) doit être validé avant
          toute émission officielle de ce reçu — voir docs/architecture/finance.md.
        </div>

        <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
          Émis le {donation.receipt_issued_at ? formatDateTime(donation.receipt_issued_at) : "—"}
        </footer>
      </div>
    </main>
  );
}
