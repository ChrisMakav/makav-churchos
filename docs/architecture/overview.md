# Architecture — MAKAV ChurchOS

## Stack

- **Next.js 16 full-stack** (App Router, Server Actions/Route Handlers comme API) — pas de backend séparé.
- **Supabase** (Postgres + Auth + Storage + Row Level Security), provisionné via l'intégration Vercel Marketplace, région `eu-central-2` (Zurich, UE — choix RGPD, produit français en premier).
- **Tailwind CSS v4** (config CSS-first dans `app/globals.css`) + **shadcn/ui** sur base **Base UI** (pas Radix — voir "Gotchas" ci-dessous).
- **Pas d'ORM.** Migrations SQL brutes (`supabase/migrations/`), types TypeScript générés (`supabase gen types typescript`), client `@supabase/supabase-js` + `@supabase/ssr`.
- **Zod** pour la validation (à introduire à l'incrément 2 avec le premier formulaire de données métier).

## Convention de nommage

- Base de données et code : **anglais/snake_case** (tables, colonnes, codes de permission, routes internes).
- Interface utilisateur : **français** (labels, segments de route sous `(dashboard)`, emails, toasts).

## Structure de dossiers

```
app/
  (marketing)/          -- landing publique ("/")
  (auth)/                -- connexion, inscription, inscription/organisation
  (dashboard)/            -- shell authentifié (voir layout.tsx)
    _components/           -- nav-config, AppSidebar, OrgSwitcherClient, UserMenuClient (client-only)
    tableau-de-bord/, membres/, departements/, evenements/, finances/, dons/, budgets/, notifications/
    parametres/             -- organisation, utilisateurs, roles (Tabs)
  api/                    -- Route Handlers (PDF, cron, webhooks — incréments suivants)
lib/
  supabase/               -- server.ts, client.ts, admin.ts, proxy.ts (session refresh), types.ts (généré)
  rbac/                   -- permissions.ts (catalogue), guard.ts (requirePermission), context.tsx (OrgProvider)
  session.ts              -- résout user + organisation active + permissions (1 fois par requête, dans le layout)
  currencies.ts
components/
  ui/                     -- shadcn/ui (base Base UI)
  nav/                    -- Sidebar, OrgSwitcher, UserMenu (génériques, pas de logique serveur)
  patterns/               -- PageHeader, StatCard, DataTable, EmptyState, ComingSoon, NotificationBell
proxy.ts                  -- racine, Next.js 16 (remplace middleware.ts, voir Gotchas)
supabase/migrations/       -- 0001_tenancy_rbac.sql, 0002_profiles_email.sql, …
```

## Déploiement

- Vercel (`vercel link` fait, projet `chrisna-s-projects/makav-churchos`).
- Variables d'environnement gérées via `vercel env pull` (Supabase provisionné en tant qu'intégration Marketplace — les clés sont injectées automatiquement, pas de `.env` géré manuellement).
- Développement local : `npm run dev`. Migrations poussées avec `supabase db push --db-url "$POSTGRES_URL_NON_POOLING"` (le projet Supabase créé via le Marketplace Vercel n'est pas visible depuis un compte Supabase classique tant qu'il n'est pas "claimed" — `supabase link` ne fonctionne donc pas, on passe systématiquement par `--db-url`).

## Gotchas rencontrés (à ne pas re-découvrir)

1. **Next.js 16 renomme `middleware.ts` en `proxy.ts`** (fonction `middleware` → `proxy`). Vérifié dans `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Le fichier `middleware.ts` fonctionne encore mais est déprécié.
2. **shadcn/ui utilise Base UI, pas Radix, sur ce projet** (`components.json` → `"style": "base-nova"`). Conséquences :
   - Composition : prop **`render={<Element />}`**, pas `asChild`.
   - `Button` rendu via `render` avec un élément non-`<button>` (ex. `next/link`) nécessite **`nativeButton={false}`**, sinon warning console.
   - `Select` : sans prop **`items`** sur `Select.Root` (ou `children` function sur `Select.Value`), le composant affiche la **valeur brute** au lieu du libellé — toujours passer `items={[{value,label}]}`.
   - `DropdownMenuLabel` (= `Menu.GroupLabel`) doit être **dans un `DropdownMenuGroup`**, sinon erreur runtime "MenuGroupContext is missing".
3. **Passage d'icônes Lucide (composants React) d'un Server Component vers un Client Component en tant que prop brute** lève "Only plain objects can be passed to Client Components" — seul du JSX déjà rendu (children) peut traverser cette frontière, pas des références de composants nues. D'où `nav-config.ts` importé directement dans `AppSidebar` (client), pas résolu côté serveur puis transmis.
4. Le projet Supabase provisionné par le Marketplace Vercel (`--no-claim`) n'apparaît pas dans la liste de projets d'un compte Supabase classique — c'est normal, la gestion passe par les variables d'environnement Vercel et `--db-url`, pas par `supabase link`.
5. **`Select` contrôlé de Base UI** : si `value` peut valoir `undefined` puis une string (ex. `value={selected || undefined}`), Base UI lève "changing the uncontrolled value state of Select to be controlled". Toujours initialiser l'état avec une string (`useState("")`), jamais `undefined`, pour rester contrôlé dès le premier rendu.
6. **Heures d'événements et fuseau horaire** : les `<input type="datetime-local">` (ex. formulaire événements) n'ont pas d'offset — Postgres les interprète en UTC à l'insertion dans une colonne `timestamptz`. Pour que l'heure affichée corresponde à l'heure saisie quel que soit le fuseau du serveur/navigateur, l'affichage force `timeZone: "UTC"` (voir `lib/format.ts` : `formatDateTime`, `toDatetimeLocalValue`, `toUtcDayKey`, `toUtcTimeLabel`) plutôt que d'utiliser le fuseau local. C'est une simplification P1 assumée (pas de conversion vers `organizations.timezone`) — limite connue : le regroupement par jour du calendrier peut placer un événement proche de minuit UTC sur la mauvaise cellule si le fuseau du serveur diffère fortement d'UTC, puisque la grille elle-même (via `date-fns`) reste calculée en heure locale du serveur. À corriger si le produit doit un jour gérer plusieurs fuseaux réels.
8. **Vues Postgres et RLS** : une vue créée sans `security_invoker = true` (Postgres 15+) s'exécute avec les privilèges de son propriétaire (le rôle de migration, qui contourne RLS) et non ceux de l'appelant — fuite multi-tenant potentielle pour toute vue exposée via PostgREST. Toujours ajouter `security_invoker = true` à la création (ou juste après, comme dans `0009_view_security_invoker.sql`). Voir `finance.md`.
9. **`proxy.ts` et les routes `/api/*`** : la garde d'authentification qui redirige vers `/connexion` ne doit jamais s'appliquer aux routes API (cron, webhooks, `curl`) — un appelant non-navigateur ne suit pas les redirections HTML et échoue silencieusement. `lib/supabase/proxy.ts` exclut `/api/*` de cette logique ; chaque route API gère sa propre authentification.
10. **Requêtes Supabase avec relation embarquée ambiguë** : quand une table a plusieurs FK vers une même table cible (ex. `members`/`families`, voir `data-model.md`), PostgREST renvoie `PGRST201` sans lever d'exception JS — `{ data, error }` avec `data: null`. Toujours vérifier `error`, pas seulement `(data ?? [])`, sous peine de listes vides silencieuses qui ressemblent à "aucune donnée" plutôt qu'à un bug.
