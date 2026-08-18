import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldIcon } from "lucide-react";
import { NotSuperAdminError, requireSuperAdmin } from "@/lib/backoffice/guard";
import { BackofficeNav } from "./_components/backoffice-nav";

export default async function BackofficeLayout({ children }: { children: ReactNode }) {
  let user;
  try {
    user = await requireSuperAdmin();
  } catch (err) {
    if (err instanceof NotSuperAdminError) redirect("/tableau-de-bord");
    throw err;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-6">
        <Link href="/backoffice" className="flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-amber-400" />
          <span className="font-heading text-base">MAKAV ChurchOS</span>
          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-amber-400">
            Backoffice
          </span>
        </Link>
        <div className="flex-1" />
        <span className="text-xs text-zinc-400">{user.fullName}</span>
        <Link href="/tableau-de-bord" className="text-xs text-zinc-400 hover:text-zinc-100">
          Quitter le backoffice
        </Link>
      </header>
      <div className="flex flex-1">
        <BackofficeNav />
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6">{children}</main>
      </div>
    </div>
  );
}
