"use client";

import { useState, useTransition } from "react";
import { CalendarClockIcon, LockIcon, SendIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ACTIVE_CHANNELS,
  CHANNEL_LABELS,
  COMMUNICATION_CHANNELS,
  type CommunicationChannel,
} from "@/lib/validation/communications";
import { sendCommunication } from "./actions";

export interface SegmentOption {
  type: "department" | "site" | "all";
  id: string | null;
  label: string;
  count: number;
}

function segmentKey(s: Pick<SegmentOption, "type" | "id">) {
  return `${s.type}:${s.id ?? ""}`;
}

export function CommunicationComposer({
  organizationId,
  availableSegments,
}: {
  organizationId: string;
  availableSegments: SegmentOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [channel, setChannel] = useState<CommunicationChannel>("app");
  const [selected, setSelected] = useState<SegmentOption[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedKeys = new Set(selected.map(segmentKey));
  const pickable = availableSegments.filter((s) => !selectedKeys.has(segmentKey(s)));
  const recipientPreview = selected.reduce((sum, s) => sum + s.count, 0);

  const canSubmit =
    ACTIVE_CHANNELS.includes(channel) && selected.length > 0 && title.trim() !== "" && body.trim() !== "";

  const submit = (schedule: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        await sendCommunication(organizationId, {
          channel,
          title,
          body,
          segments: selected.map((s) => ({ type: s.type, id: s.id, label: s.label })),
          scheduledAt: schedule && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        });
        toast.success(schedule ? "Envoi programmé." : "Message envoyé.");
        setTitle("");
        setBody("");
        setSelected([]);
        setScheduledAt("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Nouveau message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Destinataires
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2.5">
            {selected.map((s) => (
              <Badge key={segmentKey(s)} variant="secondary" className="h-6 gap-1.5 px-2.5 text-xs">
                {s.label} · {s.count}
                <button
                  type="button"
                  onClick={() => setSelected((prev) => prev.filter((x) => segmentKey(x) !== segmentKey(s)))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Popover>
              <PopoverTrigger
                disabled={pickable.length === 0}
                className="text-xs text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
              >
                + ajouter un segment
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Ajouter un segment</p>
                <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                  {pickable.map((s) => (
                    <button
                      key={segmentKey(s)}
                      type="button"
                      onClick={() => setSelected((prev) => [...prev, s])}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                    >
                      <span>{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.count}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Canal</label>
          <div className="grid grid-cols-3 gap-2">
            {COMMUNICATION_CHANNELS.map((c) => {
              const active = ACTIVE_CHANNELS.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!active}
                  onClick={() => setChannel(c)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
                    channel === c && active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-foreground hover:bg-muted",
                    !active && "text-muted-foreground",
                  )}
                >
                  {!active ? <LockIcon className="h-3.5 w-3.5" /> : null}
                  {CHANNEL_LABELS[c]}
                </button>
              );
            })}
          </div>
          {!ACTIVE_CHANNELS.includes(channel) ? (
            <p className="text-xs text-muted-foreground">
              Ce canal n&apos;est pas encore configuré (aucun fournisseur connecté).
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Message</label>
          <div className="space-y-2 rounded-lg border border-border bg-background p-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du message"
              className="border-0 px-0 font-medium shadow-none focus-visible:ring-0"
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Bonjour {prénom}, ..."
              rows={4}
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {recipientPreview} destinataire{recipientPreview > 1 ? "s" : ""} · variables : {"{prénom}"}, {"{nom}"}
          </p>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Button disabled={!canSubmit || pending} onClick={() => submit(false)}>
              <SendIcon className="h-4 w-4" />
              Envoyer maintenant
            </Button>
            <Popover>
              <PopoverTrigger
                disabled={!canSubmit || pending}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <CalendarClockIcon className="h-4 w-4" />
                Programmer
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Programmer l&apos;envoi</p>
                <div className="space-y-2 px-1">
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!scheduledAt || pending}
                    onClick={() => submit(true)}
                  >
                    Programmer
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
