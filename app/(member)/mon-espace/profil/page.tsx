import { PageHeader } from "@/components/patterns/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberSession } from "@/lib/member-session";
import { ProfilForm } from "./profil-form";

export default async function MonProfilPage() {
  const session = await getMemberSession();
  if (!session) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Mon profil" />

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            {session.member.firstName} {session.member.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
          <ProfilForm initialPhone={session.member.phone} />
        </CardContent>
      </Card>
    </div>
  );
}
