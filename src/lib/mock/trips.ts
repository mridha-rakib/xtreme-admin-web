import { customerRepository } from "@/lib/mock/customers";
import type { Booking } from "@/types/booking";
import type { CreateTripParams, Trip, UpdateTripParams } from "@/types/trip";

export class TripValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TripValidationError";
  }
}

const INITIAL_TRIPS: Trip[] = [
  {
    id: "TRIP-261124-04",
    reference: "TRIP-261124-04",
    title: "Thanksgiving in New York",
    customerId: "cus_001",
    customerName: "Olivia Carter",
    customerEmail: "olivia.carter@demo.com",
    destination: "New York / Manhattan",
    status: "OPEN",
    startDate: "2026-11-24",
    endDate: "2026-11-28",
    datesDisplay: "Nov 24 — Nov 28, 2026",
    linkedBookingIds: ["bkg_018"],
    notes: "Customer requested airport transfer and Hamptons dinner",
    createdAt: "2026-11-20T10:00:00Z",
    updatedAt: "2026-11-24T06:00:00Z",
  },
  {
    id: "TRIP-261124-02",
    reference: "TRIP-261124-02",
    title: "Hamptons Culinary Retreat",
    customerId: "cus_002",
    customerName: "Ethan Mitchell",
    customerEmail: "ethan.mitchell@demo.com",
    destination: "Southampton, NY",
    status: "IN_PROGRESS",
    startDate: "2026-11-23",
    endDate: "2026-11-27",
    datesDisplay: "Nov 23 — Nov 27, 2026",
    linkedBookingIds: ["bkg_017"],
    notes: "Private chef experience booked",
    createdAt: "2026-11-19T14:00:00Z",
    updatedAt: "2026-11-23T10:00:00Z",
  },
  {
    id: "TRIP-261124-01",
    reference: "TRIP-261124-01",
    title: "Autumn Paris Excursion",
    customerId: "cus_003",
    customerName: "Sophia Reed",
    customerEmail: "sophia.reed@demo.com",
    destination: "Paris, France",
    status: "COMPLETED",
    startDate: "2026-11-10",
    endDate: "2026-11-16",
    datesDisplay: "Nov 10 — Nov 16, 2026",
    linkedBookingIds: [],
    notes: "Trip concluded smoothly",
    createdAt: "2026-11-05T09:00:00Z",
    updatedAt: "2026-11-16T18:00:00Z",
  },
];

export class TripRepository {
  private trips: Trip[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.trips = JSON.parse(JSON.stringify(INITIAL_TRIPS));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const fn of this.listeners) {
      fn();
    }
  }

  public listTrips(): Trip[] {
    return [...this.trips];
  }

  public getTripById(id: string): Trip | undefined {
    return this.trips.find(
      (t) =>
        t.id.toLowerCase() === id.toLowerCase() || t.reference.toLowerCase() === id.toLowerCase(),
    );
  }

  public createTrip(params: CreateTripParams): Trip {
    if (!params.customerId) {
      throw new TripValidationError("Customer selection is required.");
    }
    if (!params.title || !params.title.trim()) {
      throw new TripValidationError("Trip title is required.");
    }
    if (!params.destination || !params.destination.trim()) {
      throw new TripValidationError("Destination is required.");
    }
    if (!params.startDate || !params.endDate) {
      throw new TripValidationError("Both start and end dates are required.");
    }
    if (new Date(params.endDate) < new Date(params.startDate)) {
      throw new TripValidationError("End date cannot be earlier than start date.");
    }

    const customer = customerRepository.getCustomerById(params.customerId);
    const customerName = customer
      ? `${customer.firstName} ${customer.lastName}`
      : "Valued Customer";
    const customerEmail = customer ? customer.email : "guest@example.com";

    const seq = (this.trips.length + 1).toString().padStart(2, "0");
    const ref = `TRIP-261124-${seq}`;
    const now = new Date().toISOString();

    const startFormatted = new Date(params.startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endFormatted = new Date(params.endDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const newTrip: Trip = {
      id: ref,
      reference: ref,
      title: params.title.trim(),
      customerId: params.customerId,
      customerName,
      customerEmail,
      destination: params.destination.trim(),
      status: params.status || "OPEN",
      startDate: params.startDate,
      endDate: params.endDate,
      datesDisplay: `${startFormatted} — ${endFormatted}`,
      linkedBookingIds: [],
      notes: params.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.trips.unshift(newTrip);
    this.notify();
    return newTrip;
  }

  public updateTrip(id: string, params: UpdateTripParams): Trip {
    const trip = this.getTripById(id);
    if (!trip) {
      throw new TripValidationError(`Trip not found: ${id}`);
    }

    const newStart = params.startDate || trip.startDate;
    const newEnd = params.endDate || trip.endDate;

    if (new Date(newEnd) < new Date(newStart)) {
      throw new TripValidationError("End date cannot be earlier than start date.");
    }

    if (params.title !== undefined) trip.title = params.title.trim();
    if (params.destination !== undefined) trip.destination = params.destination.trim();
    if (params.status !== undefined) trip.status = params.status;
    if (params.startDate !== undefined) trip.startDate = params.startDate;
    if (params.endDate !== undefined) trip.endDate = params.endDate;
    if (params.notes !== undefined) trip.notes = params.notes.trim();

    const startFormatted = new Date(newStart).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endFormatted = new Date(newEnd).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    trip.datesDisplay = `${startFormatted} — ${endFormatted}`;
    trip.updatedAt = new Date().toISOString();

    this.notify();
    return trip;
  }

  public resetDefaults(): void {
    this.trips = JSON.parse(JSON.stringify(INITIAL_TRIPS));
    this.notify();
  }
}

export const tripRepository = new TripRepository();
