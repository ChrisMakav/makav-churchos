"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Rechercher", href: "/mon-espace/covoiturage/rechercher" },
  { label: "Proposer", href: "/mon-espace/covoiturage/proposer" },
  { label: "Mes trajets", href: "/mon-espace/covoiturage/mes-trajets" },
  { label: "Mes réservations", href: "/mon-espace/covoiturage/mes-reservations" },
  { label: "Besoin d'un trajet", href: "/mon-espace/covoiturage/besoin-d-un-trajet" },
  { label: "Devenir chauffeur", href: "/mon-espace/covoiturage/devenir-chauffeur" },
  { label: "Mes véhicules", href: "/mon-espace/covoiturage/vehicules" },
];

export function CarpoolTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
