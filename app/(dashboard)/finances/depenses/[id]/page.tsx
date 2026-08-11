import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/patterns/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { EXPENSE_STATUS_OPTIONS } from "@/lib/validation/finance";
import { ExpenseActions } from "./expense-actions";
import { PayDialog } from "./pay-dialog";
import { ReceiptUpload } from "./receipt-upload";

const STATUS_LABEL = Object.fromEntries(EXPENSE_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending_approval: "outline",
  approved: "default",
  paid: "secondary",
  rejected: "destructive",
};

export default async function ExpenseDetailPage({
  params,
}: PageProps<"/finances/depenses/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const organizationId = session.activeOrg.organizationId;

  const [{ data: expense }, { data: accounts }] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "id, vendor, amount, currency, description, status, receipt_file_path, transaction_categories(name), departments(name)",
      )
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase.from("accounts").select("id, name").eq("organization_id", organizationId).order("name"),
  ]);

  if (!expense) notFound();

  let receiptUrl: string | null = null;
  if (expense.receipt_file_path) {
    const { data } = await supabase.storage
      .from("receipts")
      .createSignedUrl(expense.receipt_file_path, 60 * 10);
    receiptUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={expense.vendor || expense.transaction_categories?.name || "Dépense"} />

      <Card>
        <CardContent className="space-y-4">
          <Badge variant={STATUS_VARIANT[expense.status] ?? "outline"}>
            {STATUS_LABEL[expense.status] ?? expense.status}
          </Badge>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Montant</p>
              <p className="font-heading text-2xl text-foreground">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: expense.currency,
                }).format(Number(expense.amount))}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Catégorie</p>
              <p className="text-sm text-foreground">{expense.transaction_categories?.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Département</p>
              <p className="text-sm text-foreground">{expense.departments?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Justificatif</p>
              {receiptUrl ? (
                <Link href={receiptUrl} target="_blank" className="text-sm text-primary hover:underline">
                  Voir le justificatif
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun</p>
              )}
            </div>
          </div>

          {expense.description ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="text-sm whitespace-pre-wrap text-foreground">{expense.description}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {expense.status === "pending_approval" ? (
          <ExpenseActions organizationId={organizationId} expenseId={expense.id} />
        ) : null}
        {expense.status === "approved" ? (
          <PayDialog
            organizationId={organizationId}
            expenseId={expense.id}
            accounts={accounts ?? []}
          />
        ) : null}
        <ReceiptUpload
          organizationId={organizationId}
          expenseId={expense.id}
          hasReceipt={Boolean(expense.receipt_file_path)}
        />
      </div>
    </div>
  );
}
