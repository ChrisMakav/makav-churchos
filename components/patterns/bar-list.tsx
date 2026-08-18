interface BarListItem {
  label: string;
  value: number;
}

interface BarListProps {
  items: BarListItem[];
  formatValue?: (value: number) => string;
  emptyLabel?: string;
}

export function BarList({
  items,
  formatValue = (v) => String(v),
  emptyLabel = "Aucune donnée sur cette période.",
}: BarListProps) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground">{item.label}</span>
            <span className="shrink-0 font-medium text-foreground">{formatValue(item.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${item.value > 0 ? Math.max((item.value / max) * 100, 2) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
