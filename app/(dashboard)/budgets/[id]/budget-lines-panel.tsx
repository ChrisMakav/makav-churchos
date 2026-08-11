"use client";

import { useState, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addBudgetLine, removeBudgetLine } from "../actions";

export interface BudgetLineRow {
  id: string;
  categoryName: string;
  departmentName: string | null;
  allocatedAmount: number;
  spentAmount: number;
  currency: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}
export interface DepartmentOption {
  id: string;
  name: string;
}

const NO_DEPARTMENT = "__none__";

function thresholdTone(pct: number) {
  if (pct >= 100) return { bar: "bg-destructive", text: "text-destructive" };
  if (pct >= 90) return { bar: "bg-destructive", text: "text-destructive" };
  if (pct >= 70) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-success", text: "text-success" };
}

function LineProgress({ line }: { line: BudgetLineRow }) {
  const pct = line.allocatedAmount > 0 ? (line.spentAmount / line.allocatedAmount) * 100 : 0;
  const tone = thresholdTone(pct);
  const formatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: line.currency });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {line.categoryName}
          {line.departmentName ? (
            <span className="text-muted-foreground"> · {line.departmentName}</span>
          ) : null}
        </span>
        <span className={cn("text-xs font-medium", tone.text)}>{Math.round(pct)} %</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", tone.bar)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatter.format(line.spentAmount)} dépensés sur {formatter.format(line.allocatedAmount)}
      </p>
    </div>
  );
}

export function BudgetLinesPanel({
  organizationId,
  budgetId,
  lines,
  categories,
  departments,
}: {
  organizationId: string;
  budgetId: string;
  lines: BudgetLineRow[];
  categories: CategoryOption[];
  departments: DepartmentOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const [departmentId, setDepartmentId] = useState(NO_DEPARTMENT);
  const [amount, setAmount] = useState("");

  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));
  const departmentItems = [
    { value: NO_DEPARTMENT, label: "Aucun" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune ligne budgétaire.</p>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex-1">
                <LineProgress line={line} />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                onClick={() => startTransition(() => removeBudgetLine(organizationId, budgetId, line.id))}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Catégorie</label>
          <Select items={categoryItems} value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Département</label>
          <Select
            items={departmentItems}
            value={departmentId}
            onValueChange={(v) => setDepartmentId(v ?? NO_DEPARTMENT)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departmentItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Montant alloué</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            className="w-36"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button
          disabled={!categoryId || !amount || pending}
          onClick={() =>
            startTransition(async () => {
              await addBudgetLine(
                organizationId,
                budgetId,
                categoryId,
                departmentId === NO_DEPARTMENT ? null : departmentId,
                amount,
              );
              setCategoryId("");
              setAmount("");
            })
          }
        >
          Ajouter
        </Button>
      </div>
    </div>
  );
}
