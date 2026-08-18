"use client";

import { useState, useTransition } from "react";
import { PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createRoom, deleteRoom, updateRoom } from "../actions";

export interface RoomRow {
  id: string;
  name: string;
  capacity: number | null;
}

function RoomFormDialog({
  organizationId,
  room,
  trigger,
}: {
  organizationId: string;
  room?: RoomRow;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(room?.capacity != null ? String(room.capacity) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (room) {
          await updateRoom(organizationId, room.id, name, capacity);
        } else {
          await createRoom(organizationId, name, capacity);
          setName("");
          setCapacity("");
        }
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? "Modifier la salle" : "Nouvelle salle"}</DialogTitle>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="room-name">Nom</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grande salle"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-capacity">Capacité</Label>
            <Input
              id="room-capacity"
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <Button disabled={!name.trim() || pending} onClick={submit}>
            {pending ? "Enregistrement…" : room ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RoomsManager({
  organizationId,
  rooms,
}: {
  organizationId: string;
  rooms: RoomRow[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RoomFormDialog
          organizationId={organizationId}
          trigger={
            <Button>
              <PlusIcon className="h-4 w-4" />
              Nouvelle salle
            </Button>
          }
        />
      </div>

      {rooms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Aucune salle. Ajoutez vos espaces (grande salle, chapelle, salles annexes…) pour les
          faire apparaître dans la grille des événements.
        </p>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{room.name}</p>
                <p className="text-xs text-muted-foreground">
                  {room.capacity != null ? `Capacité ${room.capacity}` : "Capacité non renseignée"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <RoomFormDialog
                  organizationId={organizationId}
                  room={room}
                  trigger={
                    <Button variant="ghost" size="icon-sm">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() => startTransition(() => deleteRoom(organizationId, room.id))}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
