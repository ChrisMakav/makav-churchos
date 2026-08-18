import { PageHeader } from "@/components/patterns/page-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { formatCurrency } from "@/lib/format";

const DONATION_METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  check: "Chèque",
  transfer: "Virement",
  card: "Carte",
  mobile_money: "Mobile money",
};

export default async function MesDonsPage() {
  const session = await getMemberSession();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: org }, { data: donations }] = await Promise.all([
    supabase.from("organizations").select("currency").eq("id", session.member.organizationId).single(),
    supabase
      .from("donations")
      .select("id, amount, currency, method, given_at, receipt_number, donation_funds(name)")
      .eq("member_id", session.member.id)
      .order("given_at", { ascending: false }),
  ]);

  const currency = org?.currency ?? "XAF";
  const total = (donations ?? []).reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes dons"
        description={`${donations?.length ?? 0} don${(donations?.length ?? 0) > 1 ? "s" : ""} · ${formatCurrency(total, currency)} au total`}
      />

      {!donations || donations.length === 0 ? (
        <EmptyState
          title="Aucun don enregistré"
          description="Vos dons enregistrés par votre église apparaîtront ici."
        />
      ) : (
        <div className="space-y-2">
          {donations.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(Number(d.amount), d.currency)}
                  {d.donation_funds ? ` · ${d.donation_funds.name}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(`${d.given_at}T00:00:00Z`).toLocaleDateString("fr-FR", {
                    dateStyle: "long",
                    timeZone: "UTC",
                  })}{" "}
                  ·{" "}
                  {DONATION_METHOD_LABELS[d.method] ?? d.method}
                </p>
              </div>
              {d.receipt_number ? <Badge variant="secondary">Reçu {d.receipt_number}</Badge> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
