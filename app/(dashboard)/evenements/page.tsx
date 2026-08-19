import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoorOpenIcon,
  ListIcon,
  PlusIcon,
} from "lucide-react";
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { toUtcDayKey, toUtcTimeLabel } from "@/lib/format";
import { UNASSIGNED_ROOM_KEY } from "@/lib/validation/events";
import { ConflictsPanel, type ResourceConflict } from "./conflicts-panel";
import { WeekGrid } from "./week-grid";

const UNASSIGNED_KEY = UNASSIGNED_ROOM_KEY;

interface EventWithJoins {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  status: string;
  room_id: string | null;
  event_types: { label_fr: string; color: string } | null;
}

export default async function EvenementsPage({
  searchParams,
}: PageProps<"/evenements">) {
  const sp = await searchParams;
  const semaineParam = typeof sp.semaine === "string" ? sp.semaine : undefined;
  const anchorDate = semaineParam ? new Date(`${semaineParam}T00:00:00`) : new Date();

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const session = await getSession();
  if (!session) return null;
  const organizationId = session.activeOrg.organizationId;

  const supabase = await createClient();

  const [{ data: rooms }, { data: events }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, capacity")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("events")
      .select(
        "id, title, starts_at, ends_at, location, status, room_id, event_types(label_fr, color)",
      )
      .eq("organization_id", organizationId)
      .neq("status", "cancelled")
      .gte("starts_at", weekStart.toISOString())
      .lt("starts_at", addDays(weekEnd, 1).toISOString())
      .order("starts_at"),
  ]);

  const roomList: { id: string; name: string; capacity: number | null }[] = rooms ?? [];
  const eventList: EventWithJoins[] = events ?? [];

  const locationKeys = Array.from(
    new Set(
      eventList
        .filter((e) => !e.room_id && e.location)
        .map((e) => `loc:${e.location}`),
    ),
  ).sort();

  const hasUnassigned = eventList.some((e) => !e.room_id && !e.location);

  const rowKeyFor = (e: EventWithJoins) =>
    e.room_id ?? (e.location ? `loc:${e.location}` : UNASSIGNED_KEY);

  const rows: { key: string; label: string; capacity: number | null }[] = [
    ...roomList.map((r) => ({ key: r.id, label: r.name, capacity: r.capacity })),
    ...locationKeys.map((key) => ({ key, label: key.slice(4), capacity: null })),
    ...(hasUnassigned ? [{ key: UNASSIGNED_KEY, label: "Sans salle", capacity: null }] : []),
  ];

  const gridEvents = eventList.map((event) => ({
    id: event.id,
    title: event.title,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    color: event.event_types?.color ?? "#8a7b68",
    rowKey: rowKeyFor(event),
    dayKey: toUtcDayKey(event.starts_at),
  }));

  const gridDays = days.map((day) => ({
    key: format(day, "yyyy-MM-dd"),
    label: format(day, "EEE", { locale: fr }),
    dayNumber: format(day, "d"),
    isToday: isToday(day),
  }));

  const canEditEvents = session.activeOrg.permissions.includes("events.write");

  // Conflits : deux événements sur la même vraie salle (room_id) dont les
  // créneaux se chevauchent.
  const conflicts: ResourceConflict[] = [];
  for (const room of roomList) {
    const roomEvents = eventList
      .filter((e) => e.room_id === room.id)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    for (let i = 1; i < roomEvents.length; i++) {
      const prev = roomEvents[i - 1]!;
      const current = roomEvents[i]!;
      if (new Date(current.starts_at) < new Date(prev.ends_at)) {
        conflicts.push({
          id: `${prev.id}-${current.id}`,
          roomName: room.name,
          dayLabel: format(new Date(current.starts_at), "EEEE d MMMM", { locale: fr }),
          eventAId: prev.id,
          eventATitle: prev.title,
          eventBId: current.id,
          eventBTitle: current.title,
        });
      }
    }
  }

  // Déroulé du culte : l'événement le plus proche de maintenant cette
  // semaine (à venir en priorité, sinon le plus récent déjà passé).
  const now = new Date().getTime();
  const upcoming = eventList
    .filter((e) => new Date(e.starts_at).getTime() >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const past = eventList
    .filter((e) => new Date(e.starts_at).getTime() < now)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))[0];
  const featuredEvent = upcoming ?? past ?? null;

  const [{ data: serviceItems }, { data: registrationTracks }] = await Promise.all([
    featuredEvent
      ? supabase
          .from("event_service_items")
          .select("id, starts_at, title, owner_name")
          .eq("event_id", featuredEvent.id)
          .order("starts_at")
      : Promise.resolve({ data: [] as { id: string; starts_at: string; title: string; owner_name: string | null }[] }),
    eventList.length > 0
      ? supabase
          .from("event_registration_tracks")
          .select("id, label, capacity, registered_count, event_id, events(title)")
          .in(
            "event_id",
            eventList.map((e) => e.id),
          )
      : Promise.resolve({ data: [] as { id: string; label: string; capacity: number; registered_count: number; event_id: string; events: { title: string } | null }[] }),
  ]);

  const prevWeek = format(addDays(weekStart, -7), "yyyy-MM-dd");
  const nextWeek = format(addDays(weekStart, 7), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Événements & cultes"
        description={`Semaine du ${format(weekStart, "d")} au ${format(weekEnd, "d MMMM yyyy", { locale: fr })} · ${roomList.length} salle${roomList.length > 1 ? "s" : ""} · ${eventList.length} événement${eventList.length > 1 ? "s" : ""}`}
        actions={
          <>
            <Button variant="outline" render={<Link href="/evenements/liste" />} nativeButton={false}>
              <ListIcon className="h-4 w-4" />
              Liste
            </Button>
            <Button variant="outline" render={<Link href="/evenements/salles" />} nativeButton={false}>
              <DoorOpenIcon className="h-4 w-4" />
              Salles
            </Button>
            <Button render={<Link href="/evenements/nouveau" />} nativeButton={false}>
              <PlusIcon className="h-4 w-4" />
              Nouvel événement
            </Button>
          </>
        }
      />

      <div className="flex items-center justify-between">
        <p className="font-heading text-2xl capitalize text-foreground">
          {format(weekStart, "MMMM yyyy", { locale: fr })}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            render={<Link href={`/evenements?semaine=${prevWeek}`} />}
            nativeButton={false}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" render={<Link href="/evenements" />} nativeButton={false}>
            Cette semaine
          </Button>
          <Button
            variant="outline"
            size="icon"
            render={<Link href={`/evenements?semaine=${nextWeek}`} />}
            nativeButton={false}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune salle configurée. Ajoutez vos espaces pour organiser la grille de la semaine.
            </p>
            <Button render={<Link href="/evenements/salles" />} nativeButton={false}>
              <DoorOpenIcon className="h-4 w-4" />
              Gérer les salles
            </Button>
          </CardContent>
        </Card>
      ) : (
        <WeekGrid
          organizationId={organizationId}
          rows={rows}
          days={gridDays}
          events={gridEvents}
          canEdit={canEditEvents}
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              Déroulé du culte
              {featuredEvent ? (
                <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">
                  · {format(new Date(featuredEvent.starts_at), "EEE. d MMM", { locale: fr })}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!featuredEvent || (serviceItems ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {featuredEvent
                  ? "Aucun déroulé pour cet événement pour l'instant."
                  : "Aucun événement cette semaine."}
              </p>
            ) : (
              <div className="space-y-3">
                {(serviceItems ?? []).map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <span className="w-14 shrink-0 font-medium text-foreground">
                      {toUtcTimeLabel(item.starts_at)}
                    </span>
                    <div>
                      <p className="text-foreground">{item.title}</p>
                      {item.owner_name ? (
                        <p className="text-xs text-muted-foreground">{item.owner_name}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inscriptions ouvertes</CardTitle>
          </CardHeader>
          <CardContent>
            {(registrationTracks ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune inscription suivie cette semaine.
              </p>
            ) : (
              <div className="space-y-3">
                {(registrationTracks ?? []).map((track) => {
                  const pct = track.capacity > 0
                    ? Math.min(100, (track.registered_count / track.capacity) * 100)
                    : 0;
                  return (
                    <div key={track.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <span className="text-foreground">{track.label}</span>
                          {track.events?.title ? (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {track.events.title}
                            </span>
                          ) : null}
                        </div>
                        <span className="shrink-0 font-medium text-foreground">
                          {track.registered_count} / {track.capacity}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(pct, track.registered_count > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conflit de ressources</CardTitle>
          </CardHeader>
          <CardContent>
            <ConflictsPanel conflicts={conflicts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
