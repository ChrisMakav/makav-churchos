"use client";

import { Building2, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SiteOption {
  id: string;
  name: string;
  subtitle: string;
}

interface SiteSwitcherProps {
  current: SiteOption;
  options: SiteOption[];
  onSelect?: (id: string) => void;
}

export function SiteSwitcher({ current, options, onSelect }: SiteSwitcherProps) {
  if (options.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-sidebar-foreground/60">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{current.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-sidebar-accent/60"
          >
            <Building2 className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-sidebar-foreground">
                {current.name}
              </span>
              <span className="block truncate text-[11px] text-sidebar-foreground/50">
                {current.subtitle}
              </span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        {options.map((option) => (
          <DropdownMenuItem key={option.id} onClick={() => onSelect?.(option.id)}>
            <span className="flex flex-col">
              <span className="text-sm font-medium">{option.name}</span>
              <span className="text-xs text-muted-foreground">{option.subtitle}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
