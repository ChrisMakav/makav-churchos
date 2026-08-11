import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  hintTone?: "neutral" | "success" | "warning" | "destructive";
}

const hintToneClass: Record<NonNullable<StatCardProps["hintTone"]>, string> = {
  neutral: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function StatCard({ label, value, hint, hintTone = "neutral" }: StatCardProps) {
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5">
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent className="space-y-1 px-5">
        <p className="font-heading text-4xl text-foreground">{value}</p>
        {hint ? (
          <p className={cn("text-xs", hintToneClass[hintTone])}>{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
