import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { PrintButton } from "../../[id]/recu/print-button";

export default async function RecuAnnuelPage({
  params,
}: PageProps<"/dons/recus-annuels/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const organizationId = session.activeOrg.organizationId;

  const supabase = await createClient();
  const { data: receipt } = await supabase
    .from("annual_donation_receipts")
    .select(
      "id, fiscal_year, total_amount, donation_count, receipt_number, issued_at, member_id, members(first_name, last_name, email)",
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!receipt) notFound();

  const [{ data: organization }, { data: donations }] = await Promise.all([
    supabase.from("organizations").select("name, currency").eq("id", organizationId).single(),
    supabase
      .from("donations")
      .select("id, amount, given_at, donation_funds(name)")
      .eq("organization_id", organizationId)
      .eq("member_id", receipt.member_id)
      .gte("given_at", `${receipt.fiscal_year}-01-01`)
      .lte("given_at", `${receipt.fiscal_year}-12-31`)
      .order("given_at"),
  ]);

  const currency = organization?.currency ?? "XAF";
  const donorName = receipt.members
    ? `${receipt.members.first_name} ${receipt.members.last_name}`
    : "Donateur";

  return (
    <main className="mx-auto max-w-2xl space-y-6 bg-background px-6 py-12 print:px-0 print:py-0">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="space-y-8 rounded-xl border border-border bg-card p-10 print:border-none print:p-0">
        <header className="space-y-1 border-b border-border pb-6">
          <p className="font-heading text-2xl text-foreground">{organization?.name}</p>
          <p className="text-sm text-muted-foreground">
            Reçu fiscal annuel n° {receipt.receipt_number} — exercice {receipt.fiscal_year}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Donateur</p>
            <p className="text-sm text-foreground">{donorName}</p>
            {receipt.members?.email ? (
              <p className="text-xs text-muted-foreground">{receipt.members.email}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total des dons {receipt.fiscal_year}</p>
            <p className="font-heading text-2xl text-foreground">
              {new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(
                Number(receipt.total_amount),
              )}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Détail des dons</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-1.5 font-normal">Date</th>
                <th className="py-1.5 font-normal">Fonds</th>
                <th className="py-1.5 text-right font-normal">Montant</th>
              </tr>
            </thead>
            <tbody>
              {(donations ?? []).map((d) => (
                <tr key={d.id} className="border-b border-border/60">
                  <td className="py-1.5 text-foreground">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(d.given_at))}
                  </td>
                  <td className="py-1.5 text-foreground">{d.donation_funds?.name ?? "—"}</td>
                  <td className="py-1.5 text-right text-foreground">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(Number(d.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-dashed border-warning bg-warning/10 p-4 text-xs text-foreground">
          <strong>Modèle provisoire.</strong> Le texte légal obligatoire (mentions fiscales,
          statut de l&apos;organisation, base légale de déductibilité) doit être validé avant
          toute émission officielle de ce reçu — voir docs/architecture/finance.md.
        </div>

        <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
          Émis le {formatDateTime(receipt.issued_at)}
        </footer>
      </div>
    </main>
  );
}
