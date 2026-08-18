"use client";

import { useState, useTransition } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addRideStop, deleteRideStop } from "../../actions";

export interface RideStopRow {
  id: string;
  label: string;
  address: string | null;
}

export function RideStopsEditor({ rideId, stops }: { rideId: string; stops: RideStopRow[] }) {
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");

  const submit = () => {
    const formData = new FormData();
    formData.set("label", label);
    formData.set("address", address);
    startTransition(async () => {
      await addRideStop(rideId, formData);
      setLabel("");
      setAddress("");
    });
  };

  return (
    <div className="space-y-3">
      {stops.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun arrêt intermédiaire.</p>
      ) : (
        <div className="space-y-2">
          {stops.map((stop) => (
            <div key={stop.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2">
              <div>
                <p className="text-sm text-foreground">{stop.label}</p>
                {stop.address ? <p className="text-xs text-muted-foreground">{stop.address}</p> : null}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                onClick={() => startTransition(() => deleteRideStop(rideId, stop.id))}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
        <div className="min-w-40 flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Libellé</label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Parking de l'église" />
        </div>
        <div className="min-w-40 flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Adresse (optionnel)</label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button disabled={!label.trim() || pending} onClick={submit}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}
