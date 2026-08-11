import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 bg-background px-6 py-24 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
        M
      </span>
      <div className="space-y-3">
        <h1 className="font-heading text-5xl text-foreground">MAKAV ChurchOS</h1>
        <p className="max-w-md text-balance text-muted-foreground">
          La plateforme de gestion intégrée pour votre église : membres, familles,
          finances, événements et équipes, réunis en un seul endroit.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/connexion">Se connecter</Link>}
        />
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/inscription">Créer une organisation</Link>}
        />
      </div>
    </main>
  );
}
