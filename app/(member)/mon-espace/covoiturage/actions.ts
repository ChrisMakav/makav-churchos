"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/member-session";
import type { Database } from "@/lib/supabase/types";
import {
  rideFormSchema,
  rideStopFormSchema,
  seatRequestFormSchema,
  rideNeedFormSchema,
  driverAvailabilityFormSchema,
  incidentFormSchema,
  vehicleFormSchema,
  maskPlate,
  MAX_RECURRING_OCCURRENCES,
} from "@/lib/validation/covoiturage";

export interface CarpoolFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFrom(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

// --- Trajets ----------------------------------------------------------------

export async function createRide(
  _prevState: CarpoolFormState,
  formData: FormData,
): Promise<CarpoolFormState> {
  const session = await getMemberSession();
  if (!session) return { error: "Session expirée." };

  const result = rideFormSchema.safeParse({
    eventId: String(formData.get("eventId") ?? ""),
    vehicleId: String(formData.get("vehicleId") ?? ""),
    departureLabel: String(formData.get("departureLabel") ?? ""),
    destinationLabel: String(formData.get("destinationLabel") ?? ""),
    departsAt: String(formData.get("departsAt") ?? ""),
    estimatedArrivalAt: String(formData.get("estimatedArrivalAt") ?? ""),
    seatCapacity: String(formData.get("seatCapacity") ?? ""),
    autoConfirm: formData.get("autoConfirm") === "on",
    acceptsChildren: formData.get("acceptsChildren") === "on",
    acceptsLuggage: formData.get("acceptsLuggage") === "on",
    acceptsPets: formData.get("acceptsPets") === "on",
    nonSmoking: formData.get("nonSmoking") === "on",
    hasAirConditioning: formData.get("hasAirConditioning") === "on",
    isPmrAccessible: formData.get("isPmrAccessible") === "on",
    notes: String(formData.get("notes") ?? ""),
    recurrenceEnabled: formData.get("recurrenceEnabled") === "on",
    recurrenceUntil: String(formData.get("recurrenceUntil") ?? ""),
  });

  if (!result.success) {
    return { error: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsFrom(result.error) };
  }
  const data = result.data;

  type RideInsert = Database["public"]["Tables"]["carpool_rides"]["Insert"];
  const rows: RideInsert[] = [];
  const baseRow = {
    organization_id: session.member.organizationId,
    site_id: session.member.siteId,
    event_id: data.eventId,
    driver_member_id: session.member.id,
    vehicle_id: data.vehicleId,
    departure_label: data.departureLabel,
    destination_label: data.destinationLabel,
    seat_capacity: data.seatCapacity,
    seats_available: data.seatCapacity,
    auto_confirm: data.autoConfirm,
    accepts_children: data.acceptsChildren,
    accepts_luggage: data.acceptsLuggage,
    accepts_pets: data.acceptsPets,
    non_smoking: data.nonSmoking,
    has_air_conditioning: data.hasAirConditioning,
    is_pmr_accessible: data.isPmrAccessible,
    notes: data.notes,
    created_by: session.user.id,
  };

  if (data.recurrenceEnabled && data.recurrenceUntil) {
    const recurrenceGroupId = crypto.randomUUID();
    const start = new Date(data.departsAt);
    const arrival = data.estimatedArrivalAt ? new Date(data.estimatedArrivalAt) : null;
    const arrivalOffsetMs = arrival ? arrival.getTime() - start.getTime() : null;
    const until = new Date(data.recurrenceUntil);

    let cursor = new Date(start);
    let count = 0;
    while (cursor.getTime() <= until.getTime() && count < MAX_RECURRING_OCCURRENCES) {
      rows.push({
        ...baseRow,
        departs_at: cursor.toISOString(),
        estimated_arrival_at: arrivalOffsetMs !== null ? new Date(cursor.getTime() + arrivalOffsetMs).toISOString() : null,
        recurrence_group_id: recurrenceGroupId,
      });
      cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
      count += 1;
    }
  } else {
    rows.push({
      ...baseRow,
      departs_at: data.departsAt,
      estimated_arrival_at: data.estimatedArrivalAt,
    });
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase.from("carpool_rides").insert(rows).select("id");

  if (error || !inserted || inserted.length === 0) {
    console.error("createRide", error);
    return { error: "Impossible de créer le trajet." };
  }

  revalidatePath("/mon-espace/covoiturage/mes-trajets");
  redirect(`/mon-espace/covoiturage/mes-trajets/${inserted[0].id}`);
}

export async function updateRideDetails(rideId: string, formData: FormData) {
  const session = await getMemberSession();
  if (!session) throw new Error("Session expirée");

  const notes = String(formData.get("notes") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase
    .from("carpool_rides")
    .update({ notes: notes || null })
    .eq("id", rideId)
    .eq("driver_member_id", session.member.id);
  if (error) throw error;
  revalidatePath(`/mon-espace/covoiturage/mes-trajets/${rideId}`);
}

async function notifyConfirmedPassengers(
  rideId: string,
  type: string,
  title: string,
  body: string,
  organizationId: string,
) {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("carpool_ride_requests")
    .select("members(user_id)")
    .eq("ride_id", rideId)
    .in("status", ["confirmed", "pending"]);

  const notifications = (requests ?? [])
    .filter((r) => r.members?.user_id)
    .map((r) => ({
      organization_id: organizationId,
      user_id: r.members!.user_id as string,
      type,
      title,
      body,
      link: "/mon-espace/covoiturage/mes-reservations",
    }));

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }
}

export async function cancelRide(rideId: string) {
  const session = await getMemberSession();
  if (!session) throw new Error("Session expirée");

  const supabase = await createClient();
  const { data: ride, error } = await supabase
    .from("carpool_rides")
    .update({ status: "cancelled" })
    .eq("id", rideId)
    .eq("driver_member_id", session.member.id)
    .select("id, departure_label, destination_label")
    .single();
  if (error) throw error;

  await notifyConfirmedPassengers(
    rideId,
    "carpool_ride_cancelled",
    "Trajet annulé",
    `Le trajet ${ride.departure_label} → ${ride.destination_label} a été annulé par le conducteur.`,
    session.member.organizationId,
  );

  revalidatePath("/mon-espace/covoiturage/mes-trajets");
  revalidatePath(`/mon-espace/covoiturage/mes-trajets/${rideId}`);
}

export async function reportDelay(rideId: string, minutes: string) {
  const session = await getMemberSession();
  if (!session) throw new Error("Session expirée");

  const supabase = await createClient();
  const { data: ride, error } = await supabase
    .from("carpool_rides")
    .select("id, departure_label, destination_label")
    .eq("id", rideId)
    .eq("driver_member_id", session.member.id)
    .single();
  if (error) throw error;

  await notifyConfirmedPassengers(
    rideId,
    "carpool_ride_delayed",
    "Retard signalé",
    `Le conducteur du trajet ${ride.departure_label} → ${ride.destination_label} a signalé un retard de ${minutes} minutes.`,
    session.member.organizationId,
  );

  revalidatePath(`/mon-espace/covoiturage/mes-trajets/${rideId}`);
}

export async function markArrived(rideId: string) {
  const session = await getMemberSession();
  if (!session) throw new Error("Session expirée");

  const supabase = await createClient();
  const { data: ride, error } = await supabase
    .from("carpool_rides")
    .update({ status: "completed" })
    .eq("id", rideId)
    .eq("driver_member_id", session.member.id)
    .select("id, departure_label, destination_label")
    .single();
  if (error) throw error;

  await notifyConfirmedPassengers(
    rideId,
    "carpool_ride_arrived",
    "Trajet terminé",
    `Le conducteur est arrivé à destination pour le trajet ${ride.departure_label} → ${ride.destination_label}.`,
    session.member.organizationId,
  );

  revalidatePath("/mon-espace/covoiturage/mes-trajets");
  revalidatePath(`/mon-espace/covoiturage/mes-trajets/${rideId}`);
}

// --- Points d'arrêt -----------------------------------------------------------

export async function addRideStop(rideId: string, formData: FormData) {
  const session = await getMemberSession();
  if (!session) throw new Error("Session expirée");

  const parsed = rideStopFormSchema.safeParse({
    label: String(formData.get("label") ?? ""),
    address: String(formData.get("address") ?? ""),
    estimatedTime: String(formData.get("estimatedTime") ?? ""),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Arrêt invalide.");

  const supabase = await createClient();
  const { count } = await supabase
    .from("carpool_ride_stops")
    .select("id", { count: "exact", head: true })
    .eq("ride_id", rideId);

  const { error } = await supabase.from("carpool_ride_stops").insert({
    ride_id: rideId,
    position_order: count ?? 0,
    label: parsed.data.label,
    address: parsed.data.address,
    estimated_time: parsed.data.estimatedTime,
  });
  if (error) throw error;
  revalidatePath(`/mon-espace/covoiturage/mes-trajets/${rideId}`);
}

export async function deleteRideStop(rideId: string, stopId: string) {
  const session = await getMemberSession();
  if (!session) throw new Error("Session expirée");

  const supabase = await createClient();
  const { error } = await supabase.from("carpool_ride_stops").delete().eq("id", stopId);
  if (error) throw error;
  revalidatePath(`/mon-espace/covoiturage/mes-trajets/${rideId}`);
}

// --- Places (RPC) -------------------------------------------------------------

export async function requestSeat(
  _prevState: CarpoolFormState,
  formData: FormData,
): Promise<CarpoolFormState> {
  const session = await getMemberSession();
  if (!session) return { error: "Session expirée." };

  const result = seatRequestFormSchema.safeParse({
    rideId: String(formData.get("rideId") ?? ""),
    seatsRequested: String(formData.get("seatsRequested") ?? "1"),
    message: String(formData.get("message") ?? ""),
  });
  if (!result.success) {
    return { error: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsFrom(result.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_carpool_seat", {
    target_ride_id: result.data.rideId,
    seats: result.data.seatsRequested,
    request_message: result.data.message ?? undefined,
  });

  if (error) return { error: error.message };

  revalidatePath("/mon-espace/covoiturage/mes-reservations");
  redirect("/mon-espace/covoiturage/mes-reservations");
}

export async function respondToRequest(requestId: string, approve: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_carpool_request", {
    target_request_id: requestId,
    approve,
  });
  if (error) throw error;
  revalidatePath("/mon-espace/covoiturage/mes-trajets");
}

export async function cancelMyRequest(requestId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_carpool_request", {
    target_request_id: requestId,
  });
  if (error) throw error;
  revalidatePath("/mon-espace/covoiturage/mes-reservations");
  revalidatePath("/mon-espace/covoiturage/mes-trajets");
}

export async function markCheckin(requestId: string, boarded: boolean, noShow: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_carpool_request_checkin", {
    target_request_id: requestId,
    boarded,
    is_no_show: noShow,
  });
  if (error) throw error;
  revalidatePath("/mon-espace/covoiturage/mes-trajets");
}

// --- Véhicules ------------------------------------------------------------

export async function createVehicle(
  _prevState: CarpoolFormState,
  formData: FormData,
): Promise<CarpoolFormState> {
  const session = await getMemberSession();
  if (!session) return { error: "Session expirée." };

  const result = vehicleFormSchema.safeParse({
    brand: String(formData.get("brand") ?? ""),
    model: String(formData.get("model") ?? ""),
    color: String(formData.get("color") ?? ""),
    plateRaw: String(formData.get("plateRaw") ?? ""),
    seatCapacity: String(formData.get("seatCapacity") ?? ""),
    isPmrAccessible: formData.get("isPmrAccessible") === "on",
  });
  if (!result.success) {
    return { error: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsFrom(result.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("carpool_vehicles").insert({
    organization_id: session.member.organizationId,
    member_id: session.member.id,
    brand: result.data.brand,
    model: result.data.model,
    color: result.data.color,
    plate_masked: result.data.plateRaw ? maskPlate(result.data.plateRaw) : null,
    seat_capacity: result.data.seatCapacity,
    is_pmr_accessible: result.data.isPmrAccessible,
  });
  if (error) return { error: "Impossible d'enregistrer le véhicule." };

  revalidatePath("/mon-espace/covoiturage/vehicules");
  redirect("/mon-espace/covoiturage/vehicules");
}

export async function deleteVehicle(vehicleId: string) {
  const session = await getMemberSession();
  if (!session) throw new Error("Session expirée");

  const supabase = await createClient();
  const { error } = await supabase.from("carpool_vehicles").delete().eq("id", vehicleId).eq("member_id", session.member.id);
  if (error) throw error;
  revalidatePath("/mon-espace/covoiturage/vehicules");
}

// --- Besoins de trajet -------------------------------------------------------

export async function createRideNeed(
  _prevState: CarpoolFormState,
  formData: FormData,
): Promise<CarpoolFormState> {
  const session = await getMemberSession();
  if (!session) return { error: "Session expirée." };

  const result = rideNeedFormSchema.safeParse({
    eventId: String(formData.get("eventId") ?? ""),
    departureLabel: String(formData.get("departureLabel") ?? ""),
    neededBy: String(formData.get("neededBy") ?? ""),
    seatsNeeded: String(formData.get("seatsNeeded") ?? "1"),
    hasChildren: formData.get("hasChildren") === "on",
    notes: String(formData.get("notes") ?? ""),
  });
  if (!result.success) {
    return { error: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsFrom(result.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("carpool_ride_needs").insert({
    organization_id: session.member.organizationId,
    site_id: session.member.siteId,
    member_id: session.member.id,
    event_id: result.data.eventId,
    departure_label: result.data.departureLabel,
    needed_by: result.data.neededBy,
    seats_needed: result.data.seatsNeeded,
    has_children: result.data.hasChildren,
    notes: result.data.notes,
  });
  if (error) return { error: "Impossible d'enregistrer votre besoin." };

  revalidatePath("/mon-espace/covoiturage/besoin-d-un-trajet");
  redirect("/mon-espace/covoiturage/besoin-d-un-trajet");
}

export async function cancelRideNeed(needId: string) {
  const session = await getMemberSession();
  if (!session) throw new Error("Session expirée");

  const supabase = await createClient();
  const { error } = await supabase
    .from("carpool_ride_needs")
    .update({ status: "cancelled" })
    .eq("id", needId)
    .eq("member_id", session.member.id);
  if (error) throw error;
  revalidatePath("/mon-espace/covoiturage/besoin-d-un-trajet");
}

// --- Disponibilité chauffeur --------------------------------------------------

export async function upsertDriverAvailability(
  _prevState: CarpoolFormState,
  formData: FormData,
): Promise<CarpoolFormState> {
  const session = await getMemberSession();
  if (!session) return { error: "Session expirée." };

  const result = driverAvailabilityFormSchema.safeParse({
    vehicleId: String(formData.get("vehicleId") ?? ""),
    zones: String(formData.get("zones") ?? ""),
    frequency: String(formData.get("frequency") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    isActive: formData.get("isActive") === "on",
  });
  if (!result.success) {
    return { error: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsFrom(result.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("carpool_driver_availabilities").upsert(
    {
      organization_id: session.member.organizationId,
      member_id: session.member.id,
      vehicle_id: result.data.vehicleId,
      zones: result.data.zones,
      frequency: result.data.frequency,
      notes: result.data.notes,
      is_active: result.data.isActive,
    },
    { onConflict: "organization_id,member_id" },
  );
  if (error) return { error: "Impossible d'enregistrer votre disponibilité." };

  revalidatePath("/mon-espace/covoiturage/devenir-chauffeur");
  redirect("/mon-espace/covoiturage/devenir-chauffeur");
}

// --- Incidents ----------------------------------------------------------------

export async function reportIncident(
  _prevState: CarpoolFormState,
  formData: FormData,
): Promise<CarpoolFormState> {
  const session = await getMemberSession();
  if (!session) return { error: "Session expirée." };

  const result = incidentFormSchema.safeParse({
    rideId: String(formData.get("rideId") ?? ""),
    incidentType: String(formData.get("incidentType") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (!result.success) {
    return { error: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsFrom(result.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("carpool_incidents").insert({
    organization_id: session.member.organizationId,
    ride_id: result.data.rideId,
    reported_by_member_id: session.member.id,
    incident_type: result.data.incidentType,
    description: result.data.description,
  });
  if (error) return { error: "Impossible d'enregistrer le signalement." };

  redirect("/mon-espace/covoiturage");
}
