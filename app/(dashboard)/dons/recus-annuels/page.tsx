import Link from "next/link";
import { ReceiptIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { formatCurrency } from "@/lib/format";

export default async function RecusAnnuelsPage() {
  const session = await getSession();
  if (!session) return null;
  const organizationId = session.activeOrg.organizationId;

  const supabase = await createClient();
  const [{ data: receipts }, { data: org }] = await Promise.all([
    supabase
      .from("annual_donation_receipts")
      .select("id, fiscal_year, total_amount, donation_count, receipt_number, issued_at, members(first_name, last_name)")
      .eq("organization_id", organizationId)
      .order("fiscal_year", { ascending: false })
      .order("receipt_number", { ascending: false }),
    supabase.from("organizations").select("currency").eq("id", organizationId).single(),
  ]);

  const currency = org?.currency ?? "XAF";
  const rows = receipts ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reçus fiscaux annuels"
        description={`${rows.length} reçu${rows.length > 1 ? "s" : ""} généré${rows.length > 1 ? "s" : ""}.`}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title="Aucun reçu généré"
          description="Utilisez « Générer les reçus fiscaux » depuis le tableau de bord Dons & finances."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donateur</TableHead>
              <TableHead>Exercice</TableHead>
              <TableHead>N° de reçu</TableHead>
              <TableHead>Dons</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Émis le</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-foreground">
                  {r.members ? `${r.members.first_name} ${r.members.last_name}` : "—"}
                </TableCell>
                <TableCell>{r.fiscal_year}</TableCell>
                <TableCell className="text-muted-foreground">{r.receipt_number}</TableCell>
                <TableCell className="text-muted-foreground">{r.donation_count}</TableCell>
                <TableCell>{formatCurrency(Number(r.total_amount), currency)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(r.issued_at))}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dons/recus-annuels/${r.id}`}
                    target="_blank"
                    className="text-sm text-primary hover:underline"
                  >
                    Voir le reçu
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
