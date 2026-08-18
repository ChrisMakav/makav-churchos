import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function MemberAuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 bg-background px-4 py-16">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo-icon.png" alt="" width={36} height={36} className="h-9 w-9" priority />
        <span>
          <span className="block font-heading text-2xl text-foreground">MAKAV ChurchOS</span>
          <span className="block text-center text-xs uppercase tracking-wider text-muted-foreground">
            Espace membre
          </span>
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
