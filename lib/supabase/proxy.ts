import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

const PUBLIC_PATHS = ["/", "/connexion", "/inscription"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return pathname.startsWith("/inscription/");
}

// Rafraîchit la session Supabase à chaque requête et applique la garde
// d'accès au shell authentifié. Appelé depuis proxy.ts (root) — Next.js 16 a
// renommé le fichier `middleware.ts` en `proxy.ts` (voir node_modules/next/dist/docs).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Les routes /api/* gèrent leur propre authentification (Supabase côté
  // handler, ou un secret pour les endpoints cron) — pas de redirection HTML
  // vers /connexion, qui casserait tout appelant non-navigateur (Vercel Cron,
  // webhooks, curl).
  if (pathname.startsWith("/api/")) {
    return response;
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/connexion" || pathname === "/inscription")) {
    const url = request.nextUrl.clone();
    url.pathname = "/tableau-de-bord";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const needsOnboardingCheck =
    user && !isPublicPath(pathname) && pathname !== "/inscription/organisation";

  if (needsOnboardingCheck) {
    const { count } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    if (!count) {
      const url = request.nextUrl.clone();
      url.pathname = "/inscription/organisation";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
