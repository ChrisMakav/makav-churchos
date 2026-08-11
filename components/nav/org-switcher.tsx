"use client";

import { ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface OrgOption {
  id: string;
  name: string;
  subtitle: string;
  initials: string;
}

interface OrgSwitcherProps {
  current: OrgOption;
  options: OrgOption[];
  onSelect?: (id: string) => void;
}

export function OrgSwitcher({ current, options, onSelect }: OrgSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-left transition-colors hover:bg-sidebar-accent"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-success text-xs font-semibold text-success-foreground">
              {current.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-sidebar-foreground">
                {current.name}
              </span>
              <span className="block truncate text-xs text-sidebar-foreground/60">
                {current.subtitle}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
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
