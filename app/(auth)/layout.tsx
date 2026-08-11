import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 bg-background px-4 py-16">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          M
        </span>
        <span className="font-heading text-2xl text-foreground">MAKAV ChurchOS</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
