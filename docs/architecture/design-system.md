# Design system — MAKAV ChurchOS

## Source

Maquette de référence : `docs/design/references/maquette-claude-design.md` (projet claude.ai/design, fichier `MAKAV ChurchOS.dc.html`). Direction visuelle : chaleureuse, crème/terracotta/prune, typographie serif pour les titres.

Écran inspecté (tableau de bord) : sidebar sombre prune/noir avec logo terracotta, sélecteur de campus, sections de navigation groupées (majuscules, petites), item actif en surbrillance terracotta. Contenu principal sur fond crème, cartes blanches arrondies, chiffres en gros serif, badges de statut colorés (urgent = terracotta, nouveau = sauge). Carte "Suivi pastoral" en aplat prune.

## Stack composants

- **shadcn/ui**, base **Base UI** (pas Radix — `components.json` → `"style": "base-nova"`). Les triggers composés utilisent la prop `render={<Element />}` et non `asChild`. Pour un élément rendu qui n'est pas un vrai `<button>` (ex. `next/link`), passer `nativeButton={false}` sur `Button`, sinon Base UI émet un warning console.
- Composants installés : button, input, label, form, card, table, dialog, sheet, dropdown-menu, badge, tabs, select, calendar, sonner, avatar, separator, alert-dialog, skeleton, alert, popover, command, scroll-area, textarea, input-group.
- Icônes : lucide-react.

## Tokens (`app/globals.css`, bloc `@theme inline` + `:root`/`.dark`)

| Token | Rôle | Valeur (clair) |
|---|---|---|
| `--background` | fond de page | `#f7f1e4` (crème) |
| `--foreground` | texte principal | `#2b211c` |
| `--card` | fond des cartes | `#ffffff` |
| `--primary` | accent principal, CTA, item de nav actif | `#c2653c` (terracotta) |
| `--secondary` | surfaces secondaires | `#efe6d3` |
| `--muted` / `--muted-foreground` | texte atténué | `#f0e9da` / `#8a7b68` |
| `--accent` | aplat prune (cartes de mise en avant type "Suivi pastoral") | `#5b4358` |
| `--destructive` | erreurs, actions destructrices | `#b23b2e` |
| `--success` | deltas positifs, badge "Nouveau" | `#7c8b63` (sauge) |
| `--warning` | alertes budgétaires 70/90 % | `#c99a3e` |
| `--sidebar` / `--sidebar-foreground` | sidebar sombre | `#241b22` / `#f3ecdd` |
| `--sidebar-primary` | item de nav actif | `#c2653c` |
| `--radius` | rayon de base | `0.75rem` |

`--success`/`--warning` sont des ajouts au set shadcn par défaut (nécessaires pour les badges de seuil budgétaire, incrément 7) — déclarés dans `@theme inline` puis dans `:root`/`.dark`.

Un thème sombre (`.dark`) cohérent avec la même identité (crème → texte clair sur fond prune très sombre) est défini mais non activé par défaut ; à câbler via `next-themes` quand le mode sombre (section 36 du cahier des charges) sera prioritaire.

## Typographie

- **Titres** (`font-heading`, appliqué automatiquement à `h1`–`h4`) : "Instrument Serif" (Google Font, `next/font/google`, variable `--font-instrument-serif`), correspond à la police serif utilisée dans la maquette.
- **Corps** (`font-sans`, par défaut sur `html`) : Geist Sans (déjà présent dans le scaffold `create-next-app`).
- **Code/chiffres tabulaires** : Geist Mono.

## Composants composites (`components/patterns/*`, `components/nav/*`)

- `PageHeader` — titre serif + description + zone d'actions, en tête de chaque page de module.
- `StatCard` — carte de métrique (label, valeur en gros serif, indication de tendance colorée selon `hintTone`).
- `EmptyState` — état vide générique (icône, titre, description, action).
- `DataTable<T>` — table générique avec recherche client-side, pagination, callback de clic de ligne ; utilisée par tous les modules CRUD (membres, transactions, dons, départements, événements).
- `NotificationBell` — bouton cloche + popover, badge de compteur non lus (contenu réel branché à l'incrément 8).
- `Sidebar` / `OrgSwitcher` / `UserMenu` (`components/nav/`) — shell de navigation authentifié, câblé avec des données réelles à l'incrément 1.

## Prochaine étape

L'incrément 1 compose `Sidebar` + `OrgSwitcher` + `UserMenu` dans `(dashboard)/layout.tsx` avec les données réelles (organisation, memberships, permissions) issues de Supabase.
