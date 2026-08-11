-- MAKAV ChurchOS — correctif de sécurité : par défaut, une vue Postgres
-- s'exécute avec les privilèges de son propriétaire (le rôle de migration,
-- qui contourne RLS), pas ceux de l'utilisateur qui l'interroge via PostgREST.
-- Sans `security_invoker`, `budget_line_actuals` aurait exposé les lignes
-- budgétaires de TOUTES les organisations à n'importe quel utilisateur
-- authentifié — fuite multi-tenant. `security_invoker = true` (Postgres 15+)
-- force la vue à respecter les policies RLS de `budget_lines`/`transactions`
-- avec le rôle de l'appelant.
alter view budget_line_actuals set (security_invoker = true);
