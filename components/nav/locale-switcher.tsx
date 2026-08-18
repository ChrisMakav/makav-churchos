"use client";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LocaleSwitcher({
  locale,
  onSelect,
}: {
  locale: Locale;
  onSelect: (locale: Locale) => void;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-border text-xs font-medium">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onSelect(l)}
          className={cn(
            "px-2 py-1.5 uppercase transition-colors",
            locale === l
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
