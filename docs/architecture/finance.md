# Finances — MAKAV ChurchOS

## Modèle : ledger simple entrée

`transactions` est un journal **simple entrée** : chaque ligne a un seul compte, un montant positif, et un `type` (`income`|`expense`|`transfer`) qui détermine le signe. Ce n'est **pas** de la comptabilité en partie double (pas de débit/crédit croisés) — décision assumée pour le P1, cohérente avec le scope du cahier des charges ("recettes/dépenses"). Le solde d'un compte se calcule à la volée : `opening_balance + Σ(income) - Σ(expense)` sur les transactions `status = 'posted'` (voir `finances/comptes/page.tsx`).

**Limite connue** : pas de vrai bilan comptable (trial balance) possible sans migration vers de la partie double. À trancher tôt si des exigences d'audit comptable formel sont anticipées — retrofit = migration de données, pas juste un ajout de colonnes.

## Flux dépense → transaction

```
draft → pending_approval → approved → paid
                ↓
             rejected
```

- `createExpense` (Server Action) insère directement en `pending_approval` — pas d'étape "brouillon" dans l'UI actuelle (le statut `draft` existe dans le schéma pour un usage futur).
- `approve_expense(id, approve)` (RPC `SECURITY DEFINER`) fait transiter `pending_approval → approved|rejected`, vérifie `finance.expenses.approve` en interne.
- `mark_expense_paid(id, account_id, occurred_on)` (RPC `SECURITY DEFINER`) — **seul chemin** pour créer la transaction correspondante : insère la ligne dans `transactions` (`type='expense'`, montant/catégorie copiés depuis la dépense) et bascule `expenses.status = 'paid'` **dans la même fonction**, donc atomique (pas de dépense "payée" sans transaction, ni l'inverse).
- Les recettes n'ont pas ce workflow d'approbation — `createIncomeTransaction` insère directement une ligne `transactions` (`type='income'`), utilisé pour les dons/dîmes en attendant le module dédié de l'incrément 6.

## Catégories

`transaction_categories` (kind `income`|`expense`) seedées par défaut à la création d'une organisation (`seed_default_transaction_categories`, appelée par `create_organization` — même pattern que `seed_default_event_types`, voir `data-model.md`).

## Justificatifs (bucket `receipts`)

Bucket Supabase Storage privé, chemin `{organization_id}/expenses/{expense_id}/{timestamp}-{filename}`. Policies RLS sur `storage.objects` basées sur le premier segment du chemin (`(storage.foldername(name))[1]::uuid`) comparé via `is_org_member`/`has_permission('finance.expenses.write')` — même pattern que les autres tables, adapté au chemin de fichier plutôt qu'à une colonne `organization_id`. La lecture passe par une URL signée à durée limitée (`createSignedUrl`, 10 min), générée à la demande dans `depenses/[id]/page.tsx` — jamais d'URL publique permanente.

## Dons / Dîmes (incrément 6)

`donation_funds` (Dîme, Offrande, Missions par défaut, `is_restricted` non encore appliqué — voir limite ci-dessous) et `donations` (`member_id` nullable pour don anonyme/non identifié, `is_anonymous` contrôle uniquement l'affichage du nom, pas l'anonymat réel côté base).

**RPC `create_donation`** (`SECURITY DEFINER`) — chemin **unique** de création (pas de policy `insert` client sur `donations`), garantit l'atomicité de trois opérations dans une seule transaction SQL implicite :
1. poste la transaction correspondante (`type='income'`, catégorie comptable "Dons" — recherchée par nom, distincte du `fund_id` donateur),
2. attribue un numéro de reçu via `next_receipt_number()` (séquentiel, sans trou, par organisation et année civile — `receipt_counters` + upsert atomique, jamais un `count(*)`),
3. insère la ligne `donations`.

**Reçu imprimable** : `app/dons/[id]/recu/page.tsx`, volontairement **hors du groupe `(dashboard)`** (pas de sidebar/topbar) pour produire un document autonome, imprimable via `window.print()` (bouton masqué en impression via la classe `print:hidden`). **Déviation assumée par rapport au plan initial**, qui prévoyait un Route Handler (`api/dons/[id]/recu/route.ts`) générant un vrai PDF binaire — une page HTML imprimable évite d'introduire une dépendance de génération PDF alors que le contenu légal n'est de toute façon pas encore validé (voir ci-dessous). Migration vers un PDF serveur réel = travail futur si le HTML imprimable s'avère insuffisant.

**Contenu légal du reçu — bloquant avant mise en production.** Le texte actuel (`page.tsx` du reçu) est un encart "Modèle provisoire" explicite. Les mentions obligatoires (base légale de déductibilité, statut de l'organisation, numéro d'enregistrement le cas échéant) dépendent de la juridiction de chaque église cliente et doivent être validées hors ingénierie avant qu'un reçu ne soit remis à un donateur pour ses impôts.

## Budgets (incrément 7)

`budgets` (statut draft/active/closed) → `budget_lines` (catégorie + département optionnel + montant alloué). `transactions.budget_line_id` et `expenses.budget_line_id` (posés par migration `ALTER TABLE`, différés depuis l'incrément 5) permettent d'imputer une dépense à une ligne.

**Vue `budget_line_actuals`** : `spent_amount` calculé par agrégation des transactions `type='expense', status='posted'` liées à chaque ligne. **Piège de sécurité corrigé** (`0009_view_security_invoker.sql`) : une vue Postgres s'exécute par défaut avec les privilèges de son propriétaire (le rôle de migration, qui contourne RLS), pas ceux de l'utilisateur qui l'interroge via PostgREST — sans `security_invoker = true` (Postgres 15+), cette vue aurait exposé les lignes budgétaires de **toutes les organisations** à n'importe quel utilisateur authentifié. Réflexe à appliquer systématiquement à toute future vue exposée via l'API.

**Alertes de seuil** : `app/api/cron/budget-alerts/route.ts` (Vercel Cron quotidien, voir `vercel.ts`) calcule le pourcentage consommé de chaque ligne d'un budget `active`, et insère une notification + une ligne `budget_alerts_sent` (idempotence via contrainte unique `(budget_line_id, threshold)`) au premier passage au-dessus de 70/90/100 %. Utilise le client service-role (`lib/supabase/admin.ts`) car ce job n'est rattaché à aucun utilisateur — il doit voir toutes les organisations. Les destinataires sont les membres actifs ayant la permission `budgets.write`. Protégé par `CRON_SECRET` (env var optionnelle ; sans elle, l'endpoint reste ouvert — à définir avant la mise en production).

**Piège de proxy découvert en testant ce endpoint** : `proxy.ts` redirigeait `/api/*` vers `/connexion` comme n'importe quelle route protégée, cassant tout appel non-navigateur (Vercel Cron, `curl`, futurs webhooks). Corrigé en excluant `/api/*` de la logique de redirection HTML dans `lib/supabase/proxy.ts` — chaque route API gère sa propre authentification (session Supabase ou secret).

## Ce qui n'est pas encore fait

- **Fonds restreints** : `donation_funds.is_restricted` existe mais rien ne vérifie qu'une dépense sur un fonds restreint correspond à une ligne budgétaire — flag sans comportement.
- **Rapprochement bancaire, comptes multiples avec transferts inter-comptes** : le `type='transfer'` existe dans la contrainte `check` de `transactions` mais aucune UI ne le crée encore.
- **UI des notifications** : la table existe et le cron y insère des lignes, mais aucune page ne les affiche encore (prévu incrément 8 — la cloche de notification dans le topbar affiche actuellement toujours "0").
