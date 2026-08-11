# RBAC — MAKAV ChurchOS

## Principe

Deux frontières, délibérément :

- **RLS = frontière de sécurité réelle.** Chaque table tenant-scoped a `organization_id` + policies basées sur `is_org_member()`/`has_permission()`. Même un bug applicatif ne peut pas faire fuiter les données d'une organisation vers une autre.
- **`requirePermission()` côté serveur** (`lib/rbac/guard.ts`) = UX + logique de workflow que RLS exprime mal (transitions d'état, seuils). **Ne jamais** compter sur le masquage d'un bouton côté client comme frontière de sécurité — `OrgProvider`/`useHasPermission` (`lib/rbac/context.tsx`) ne sert qu'à l'affichage.

## Catalogue des rôles

11 rôles système seedés (`organization_id is null`, `is_system = true`), 6 câblés dans l'onboarding/invitation P1 :

| Code | Label | Couvre (brief) | Câblé en UI P1 |
|---|---|---|---|
| `super_admin` | Super administrateur | Super Admin | non |
| `org_admin` | Administrateur d'église | Church Admin, Admin Manager | **oui** |
| `pastor` | Pasteur (principal / adjoint) | Senior/Associate Pastor | **oui** |
| `finance_manager` | Responsable financier / Trésorier | Finance Manager, Treasurer | **oui** |
| `dept_head` | Responsable de département / groupe / événement | Dept Head, Group Leader, Event Manager | **oui** |
| `member` | Membre | Member | **oui** |
| `visitor` | Visiteur | Visitor | non |
| `volunteer_manager` | Responsable RH / bénévoles | HR/Volunteer Manager | non |
| `communications_manager` | Responsable communication | Communications Manager | non |
| `technical_manager` | Responsable technique | Technical Manager | non |
| `hr_manager` | Responsable administratif | Admin Manager (RH) | non |

Ajouter un rôle au sélecteur d'invitation P1 = ajouter son `code` à `P1_ROLE_OPTIONS` (`app/(dashboard)/parametres/utilisateurs/roles.ts`) — pas de migration nécessaire, le rôle existe déjà en base.

## Catalogue des permissions

Format `module.ressource.action`. Source de vérité TypeScript : `lib/rbac/permissions.ts` (const `PERMISSIONS`), miroir exact du seed dans `supabase/migrations/0001_tenancy_rbac.sql`.

**Checklist pour ajouter une permission :**
1. Ajouter le code à `PERMISSIONS` dans `lib/rbac/permissions.ts`.
2. Ajouter une ligne `insert into permissions (code, description) values (...)` dans une nouvelle migration.
3. Attribuer la permission aux rôles concernés via `role_permissions` dans la même migration.
4. Ajouter une policy RLS sur la table concernée si nécessaire (`with check (has_permission(organization_id, 'nouveau.code'))`).
5. Appeler `requirePermission(organizationId, 'nouveau.code')` en tête de la Server Action correspondante.

## Le pattern RLS

```sql
create policy members_write on members for insert
  to authenticated
  with check (is_org_member(organization_id) and has_permission(organization_id, 'members.write'));
```

`is_org_member`/`has_permission` sont `SECURITY DEFINER STABLE` — elles évitent la récursion RLS (une policy sur `memberships` qui interrogerait `memberships` via une sous-requête RLS-filtrée créerait une boucle). La table `memberships` n'est **jamais** insérée directement par le client : uniquement via les RPC `create_organization`, `invite_member`, `set_membership_role`, `set_membership_status` (toutes `SECURITY DEFINER`, qui vérifient `has_permission` en interne).

## Exemple d'usage — Server Action

```ts
// app/(dashboard)/parametres/organisation/actions.ts
await requirePermission(organizationId, "organization.manage");
```

`requirePermission` lève `PermissionDeniedError` si la permission est absente — la Server Action doit attraper cette erreur et retourner un message utilisateur, pas la laisser remonter comme une 500 brute.

## Multi-org

Un utilisateur peut appartenir à plusieurs organisations (ex. un responsable régional). L'organisation "active" est stockée dans le cookie `active_organization_id` (`lib/session.ts`), modifiable via `OrgSwitcher` → `switchOrganization()` (`app/(dashboard)/actions.ts`). Toute requête de données dans les pages du dashboard doit utiliser `session.activeOrg.organizationId`, jamais une organisation déduite autrement.
