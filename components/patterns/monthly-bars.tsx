import { cn } from "@/lib/utils";

interface MonthlySeries {
  key: string;
  label: string;
  colorClass: string; // classe Tailwind bg-*
}

interface MonthlyPoint {
  label: string;
  values: Record<string, number>; // keyed par MonthlySeries.key
}

interface MonthlyBarsProps {
  points: MonthlyPoint[];
  series: MonthlySeries[];
  formatValue?: (value: number) => string;
  height?: number;
}

const CHART_HEIGHT = 160;

export function MonthlyBars({
  points,
  series,
  formatValue = (v) => String(v),
  height = CHART_HEIGHT,
}: MonthlyBarsProps) {
  const max = Math.max(1, ...points.flatMap((p) => series.map((s) => p.values[s.key] ?? 0)));

  return (
    <div>
      <div className="flex items-end gap-2 overflow-x-auto pb-1" style={{ height: height + 24 }}>
        {points.map((point) => (
          <div key={point.label} className="flex min-w-[28px] flex-1 flex-col items-center gap-1.5">
            <div className="flex items-end gap-0.5" style={{ height }}>
              {series.map((s) => {
                const value = point.values[s.key] ?? 0;
                const barHeight = value > 0 ? Math.max((value / max) * height, 2) : 0;
                return (
                  <div
                    key={s.key}
                    className={cn("w-2.5 rounded-t sm:w-3", s.colorClass)}
                    style={{ height: barHeight }}
                    title={`${s.label} — ${point.label} : ${formatValue(value)}`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] whitespace-nowrap text-muted-foreground">{point.label}</span>
          </div>
        ))}
      </div>
      {series.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-4">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", s.colorClass)} />
              {s.label}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
