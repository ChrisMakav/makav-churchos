import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { toCsvRow } from "@/lib/reports";
import { DONATION_METHOD_OPTIONS } from "@/lib/validation/donations";

const METHOD_LABEL = Object.fromEntries(DONATION_METHOD_OPTIONS.map((o) => [o.value, o.label]));

// Route Handler pour la même raison que l'export finances : réponse binaire
// (CSV), authentification vérifiée ici car proxy.ts exclut /api/* de sa
// redirection HTML.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const { data: donations, error } = await supabase
    .from("donations")
    .select(
      "given_at, amount, currency, method, is_anonymous, receipt_number, donation_funds(name), members(first_name, last_name)",
    )
    .eq("organization_id", organizationId)
    .order("given_at", { ascending: false });

  if (error) {
    return new NextResponse("Erreur lors de la génération du rapport", { status: 500 });
  }

  const header = toCsvRow(["Date", "Donateur", "Fonds", "Montant", "Devise", "Mode de paiement", "N° de reçu"]);
  const lines = (donations ?? []).map((d) => {
    // Même convention d'affichage que dons/page.tsx : is_anonymous masque le
    // nom même pour un rapport interne (voir docs/architecture/finance.md —
    // is_anonymous ne contrôle que l'affichage, pas l'anonymat réel en base).
    const donorName = d.is_anonymous
      ? "Anonyme"
      : d.members
        ? `${d.members.first_name} ${d.members.last_name}`
        : "Non renseigné";

    return toCsvRow([
      d.given_at,
      donorName,
      d.donation_funds?.name ?? "",
      Number(d.amount).toFixed(2),
      d.currency,
      METHOD_LABEL[d.method] ?? d.method,
      d.receipt_number ?? "",
    ]);
  });

  const csv = String.fromCharCode(0xfeff) + [header, ...lines].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rapport-dons-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
