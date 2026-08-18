"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { globalSearch, type SearchResult } from "./global-search-actions";
import { useTranslations } from "@/lib/i18n/context";

const CATEGORY_ORDER: SearchResult["category"][] = ["membres", "dons", "événements", "groupes", "départements"];

export function GlobalSearch({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();

    debounceRef.current = setTimeout(
      () => {
        if (trimmed.length < 2) {
          setResults([]);
          return;
        }
        startTransition(async () => {
          const found = await globalSearch(organizationId, query);
          setResults(found);
        });
      },
      trimmed.length < 2 ? 0 : 200,
    );

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, organizationId]);

  const select = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{t("common.search")}</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Recherche" description="Rechercher dans votre église">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("common.search")}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.trim().length < 2 ? (
              <CommandEmpty>Tapez au moins 2 caractères…</CommandEmpty>
            ) : pending ? (
              <CommandEmpty>Recherche…</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>Aucun résultat.</CommandEmpty>
            ) : (
              CATEGORY_ORDER.map((category) => {
                const items = results.filter((r) => r.category === category);
                if (items.length === 0) return null;
                return (
                  <CommandGroup key={category} heading={category}>
                    {items.map((item) => (
                      <CommandItem
                        key={`${item.category}-${item.id}`}
                        value={`${item.category}-${item.id}-${item.label}`}
                        onSelect={() => select(item.href)}
                      >
                        <div className="flex flex-col">
                          <span>{item.label}</span>
                          {item.sublabel ? (
                            <span className="text-xs text-muted-foreground">{item.sublabel}</span>
                          ) : null}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
