import { PageHeader } from "@/components/patterns/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { P1_ROLE_OPTIONS } from "../utilisateurs/roles";

export default async function RolesPage() {
  const supabase = await createClient();
  const p1Codes = P1_ROLE_OPTIONS.map((r) => r.code);

  const { data: roles } = await supabase
    .from("roles")
    .select("id, code, label_fr, role_permissions(permissions(code))")
    .is("organization_id", null)
    .order("code");

  const p1Roles = (roles ?? []).filter((r) => p1Codes.includes(r.code as never));
  const otherRoles = (roles ?? []).filter((r) => !p1Codes.includes(r.code as never));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rôles & permissions"
        description="Catalogue des rôles système. Lecture seule en Incrément 1."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {p1Roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle className="font-heading text-lg">{role.label_fr}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {role.role_permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Accès self-service uniquement.</p>
              ) : (
                role.role_permissions.map((rp, i) => (
                  <Badge key={i} variant="secondary">
                    {rp.permissions?.code}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {otherRoles.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl text-foreground">
            Rôles non activés pour cette version
          </h2>
          <p className="text-sm text-muted-foreground">
            Réservés pour les prochaines versions (bénévoles, communication, technique…).
          </p>
          <div className="flex flex-wrap gap-2">
            {otherRoles.map((role) => (
              <Badge key={role.id} variant="outline">
                {role.label_fr}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
