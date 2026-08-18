import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface CarpoolRideSummary {
  seat_capacity: number;
  seats_available: number;
}

export function CarpoolPanel({
  eventId,
  rides,
}: {
  eventId: string;
  rides: CarpoolRideSummary[];
}) {
  const totalCapacity = rides.reduce((sum, r) => sum + r.seat_capacity, 0);
  const totalAvailable = rides.reduce((sum, r) => sum + r.seats_available, 0);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1 text-sm text-foreground">
        <p>
          {rides.length} trajet{rides.length > 1 ? "s" : ""} proposé{rides.length > 1 ? "s" : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {totalAvailable}/{totalCapacity} places disponibles
        </p>
      </div>
      <Button variant="outline" size="sm" render={<Link href={`/covoiturage/trajets?event=${eventId}`} />} nativeButton={false}>
        Voir les trajets
      </Button>
    </div>
  );
}
