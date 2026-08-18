import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface MemberSessionData {
  user: { id: string; email: string };
  member: {
    id: string;
    organizationId: string;
    siteId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    photoUrl: string | null;
  };
  organizationName: string;
}

// Équivalent de getSession() (lib/session.ts) pour le portail membre — modèle
// distinct : pas de rôle/permissions/org active, un membre est rattaché à sa
// fiche `members` (user_id = auth.uid()), pas à une `memberships` staff. Un
// même compte peut avoir les deux (voir 0020_member_portal.sql).
export async function getMemberSession(): Promise<MemberSessionData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: members } = await supabase
    .from("members")
    .select("id, organization_id, site_id, first_name, last_name, email, phone, photo_url, organizations(name)")
    .eq("user_id", user.id)
    .eq("member_status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  const member = members?.[0];
  if (!member) return null;

  return {
    user: { id: user.id, email: user.email ?? "" },
    member: {
      id: member.id,
      organizationId: member.organization_id,
      siteId: member.site_id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      photoUrl: member.photo_url,
    },
    organizationName: member.organizations?.name ?? "",
  };
}
