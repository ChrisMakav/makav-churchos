import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/patterns/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { toUtcDayKey, toUtcTimeLabel } from "@/lib/format";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default async function CalendrierPage({
  searchParams,
}: PageProps<"/evenements/calendrier">) {
  const sp = await searchParams;
  const moisParam = typeof sp.mois === "string" ? sp.mois : undefined;
  const anchorDate = moisParam ? new Date(`${moisParam}-01T00:00:00`) : new Date();

  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, event_types(label_fr, color)")
    .eq("organization_id", session.activeOrg.organizationId)
    .gte("starts_at", gridStart.toISOString())
    .lte("starts_at", gridEnd.toISOString())
    .order("starts_at");

  const eventsByDay = new Map<string, typeof events>();
  for (const event of events ?? []) {
    const key = toUtcDayKey(event.starts_at);
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(event);
  }

  const prevMonth = format(subMonths(anchorDate, 1), "yyyy-MM");
  const nextMonth = format(addMonths(anchorDate, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendrier"
        actions={
          <Button render={<Link href="/evenements/nouveau" />} nativeButton={false}>
            Nouvel événement
          </Button>
        }
      />

      <div className="flex items-center justify-between">
        <p className="font-heading text-2xl capitalize text-foreground">
          {format(anchorDate, "MMMM yyyy", { locale: fr })}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            render={<Link href={`/evenements/calendrier?mois=${prevMonth}`} />}
            nativeButton={false}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" render={<Link href="/evenements/calendrier" />} nativeButton={false}>
            Aujourd&apos;hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            render={<Link href={`/evenements/calendrier?mois=${nextMonth}`} />}
            nativeButton={false}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, anchorDate);

            return (
              <div
                key={key}
                className="min-h-28 border-b border-r border-border p-2 last:border-r-0 [&:nth-child(7n)]:border-r-0"
              >
                <span
                  className={
                    isToday(day)
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
                      : `text-xs ${inMonth ? "text-foreground" : "text-muted-foreground/50"}`
                  }
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Link
                      key={event.id}
                      href={`/evenements/${event.id}`}
                      className="block truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                      style={{ backgroundColor: event.event_types?.color ?? "#8a7b68" }}
                    >
                      {toUtcTimeLabel(event.starts_at)} {event.title}
                    </Link>
                  ))}
                  {dayEvents.length > 3 ? (
                    <p className="px-1.5 text-[11px] text-muted-foreground">
                      +{dayEvents.length - 3} de plus
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
