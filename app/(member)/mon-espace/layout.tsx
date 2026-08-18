import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import { MemberShell } from "./_components/member-shell";
import { signOutMember } from "./actions";

export default async function MonEspaceLayout({ children }: { children: ReactNode }) {
  const session = await getMemberSession();

  if (!session) {
    // Authentifié (le proxy laisse passer) mais aucune fiche `members` liée à
    // cet email — cas d'un compte créé sur /mon-espace/inscription sans
    // fiche membre existante côté église. Ne pas rediriger vers connexion
    // (boucle infinie) : expliquer et proposer de se déconnecter.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/mon-espace/connexion");

    return (
      <div className="mx-auto flex min-h-full max-w-md flex-1 items-center justify-center px-4">
        <EmptyState
          title="Aucune fiche membre trouvée"
          description={`Aucun profil membre n'est associé à ${user.email}. Contactez votre église pour qu'elle enregistre votre fiche avec cet email, puis reconnectez-vous.`}
          action={
            <form action={signOutMember}>
              <Button variant="outline" type="submit">
                Se déconnecter
              </Button>
            </form>
          }
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .is("read_at", null);

  return (
    <MemberShell
      fullName={`${session.member.firstName} ${session.member.lastName}`}
      email={session.user.email}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </MemberShell>
  );
}
