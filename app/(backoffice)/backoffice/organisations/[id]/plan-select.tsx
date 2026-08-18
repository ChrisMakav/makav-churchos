"use client";

import { useState, useTransition } from "react";
import { updateOrganizationPlan } from "./actions";

// Champ texte plutôt qu'une liste déroulante figée : aucun catalogue de
// plans/tarifs n'existe ailleurs dans le produit (organizations.plan est un
// simple texte, défaut "starter") — inventer une grille tarifaire ici serait
// arbitraire. Le backoffice se contente de permettre l'édition de la valeur
// existante.
export function PlanSelect({ organizationId, plan }: { organizationId: string; plan: string }) {
  const [value, setValue] = useState(plan);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        className="w-32 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 disabled:opacity-50"
      />
      <button
        type="button"
        disabled={pending || value.trim() === plan}
        onClick={() => startTransition(() => updateOrganizationPlan(organizationId, value.trim()))}
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
      >
        Enregistrer
      </button>
    </div>
  );
}
