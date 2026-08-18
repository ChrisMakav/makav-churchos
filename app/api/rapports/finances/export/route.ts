import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { toCsvRow } from "@/lib/reports";

const TYPE_LABEL: Record<string, string> = {
  income: "Recette",
  expense: "Dépense",
  transfer: "Transfert",
};

// Route Handler (pas une Server Action) car il produit une réponse binaire
// (CSV téléchargeable) plutôt qu'une mutation — voir le même choix pour le
// reçu de don. proxy.ts exclut /api/* de la redirection HTML vers /connexion,
// donc l'authentification est vérifiée ici explicitement.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const organizationId = session.activeOrg.organizationId;
  const supabase = await createClient();

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      "occurred_on, type, amount, currency, description, transaction_categories(name), accounts(name)",
    )
    .eq("organization_id", organizationId)
    .eq("status", "posted")
    .order("occurred_on", { ascending: false });

  if (error) {
    return new NextResponse("Erreur lors de la génération du rapport", { status: 500 });
  }

  const header = toCsvRow(["Date", "Type", "Catégorie", "Compte", "Montant", "Devise", "Description"]);
  const lines = (transactions ?? []).map((t) =>
    toCsvRow([
      t.occurred_on,
      TYPE_LABEL[t.type] ?? t.type,
      t.transaction_categories?.name ?? "",
      t.accounts?.name ?? "",
      Number(t.amount).toFixed(2),
      t.currency,
      t.description ?? "",
    ]),
  );

  // BOM UTF-8 en tête : Excel (destinataire probable d'un export financier)
  // n'auto-détecte pas l'UTF-8 sans lui et afficherait les accents corrompus.
  const csv = String.fromCharCode(0xfeff) + [header, ...lines].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rapport-finances-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
