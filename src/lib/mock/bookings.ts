import { customerRepository } from "@/lib/mock/customers";
import type {
  Booking,
  BookingChangeRequest,
  BookingFilterOptions,
  BookingLifecycleStatus,
  BookingListResult,
  CreateBookingParams,
  ResolveChangeRequestParams,
} from "@/types/booking";

export class StaleVersionConflictError extends Error {
  currentVersion: number;
  expectedVersion: number;

  constructor(expected: number, current: number) {
    super(
      `Stale version conflict (409): Expected booking version ${expected}, but current authoritative record is at version ${current}. Please reload authoritative record before resolving.`,
    );
    this.name = "StaleVersionConflictError";
    this.expectedVersion = expected;
    this.currentVersion = current;
  }
}

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "bkg_018",
    reference: "XC-261124-018",
    version: 3,
    lifecycleStatus: "PENDING_ADMIN",
    vendorDecision: "ACCEPTED",
    paymentStatus: "PAYMENT_DUE",
    changeRequestStatus: "PENDING_MODIFICATION",
    assignmentStatus: "UNASSIGNED",
    bookingMode: "CONCIERGE_ASSISTED",
    customerId: "cus_001",
    customerName: "Olivia Carter",
    customerEmail: "olivia.carter@demo.com",
    customerLocation: "New York",
    serviceId: "srv_airport",
    serviceName: "Airport Transfer · JFK",
    serviceCategory: "chauffeur",
    vendorServiceId: "vs_sedan_pickup",
    vendorServiceName: "Executive Sedan Pickup",
    tripId: "TRIP-261124-04",
    destination: "JFK Airport → Manhattan",
    schedule: "2026-11-24T07:30:00",
    scheduleDisplay: "Nov 24, 2026 · 07:30 EST",
    priceAmount: 185,
    currency: "USD",
    paymentSummaryDisplay: "USD 185 · Payment due",
    dynamicFields: {
      passengers: "2 passengers",
      luggage: "2 suitcases",
      flightNumber: "AF006",
    },
    customerNotes: "Meet at arrivals with name sign",
    createdAt: "2026-11-23T18:00:00Z",
    updatedAt: "2026-11-24T06:15:00Z",
  },
  {
    id: "bkg_017",
    reference: "XC-261124-017",
    version: 1,
    lifecycleStatus: "CONFIRMED",
    vendorDecision: "ACCEPTED",
    paymentStatus: "AUTHORIZED",
    changeRequestStatus: "NONE",
    assignmentStatus: "ASSIGNED",
    assignedStaffName: "Chef Antoine Dupont",
    bookingMode: "CONCIERGE_ASSISTED",
    customerId: "cus_002",
    customerName: "Ethan Mitchell",
    customerEmail: "ethan.mitchell@demo.com",
    customerLocation: "Southampton, NY",
    serviceId: "srv_chef",
    serviceName: "Private Chef · Hamptons",
    serviceCategory: "dining",
    vendorServiceId: "vs_french_dinner",
    vendorServiceName: "French Haute Cuisine Dinner",
    tripId: "TRIP-261124-02",
    destination: "Meadow Lane Estate, Southampton",
    schedule: "2026-11-24T19:00:00",
    scheduleDisplay: "Nov 24 · 19:00",
    priceAmount: 650,
    currency: "USD",
    paymentSummaryDisplay: "USD 650 · Authorized",
    dynamicFields: {
      guests: "4 guests",
      courses: "5 course tasting",
      dietary: "Gluten free for 1 guest",
    },
    customerNotes: "Sommelier wine pairing requested",
    createdAt: "2026-11-22T14:30:00Z",
    updatedAt: "2026-11-23T10:00:00Z",
  },
  {
    id: "bkg_016",
    reference: "XC-261124-016",
    version: 1,
    lifecycleStatus: "PENDING_ADMIN",
    vendorDecision: "PENDING",
    paymentStatus: "PAYMENT_DUE",
    changeRequestStatus: "NONE",
    assignmentStatus: "UNASSIGNED",
    bookingMode: "CONCIERGE_ASSISTED",
    customerId: "cus_003",
    customerName: "Sophia Reed",
    customerEmail: "sophia.reed@demo.com",
    customerLocation: "Manhattan",
    serviceId: "srv_yacht",
    serviceName: "Yacht Charter · Hudson",
    serviceCategory: "yacht",
    vendorServiceId: "vs_sunset_cruise",
    vendorServiceName: "Hudson River Sunset Cruise",
    destination: "Chelsea Piers Pier 59",
    schedule: "2026-11-25T10:00:00",
    scheduleDisplay: "Nov 25 · 10:00",
    priceAmount: 2400,
    currency: "USD",
    paymentSummaryDisplay: "USD 2,400 · Payment due",
    dynamicFields: {
      duration: "4 hours",
      passengers: "6 guests",
    },
    customerNotes: "Champagne welcome upon boarding",
    createdAt: "2026-11-23T09:15:00Z",
    updatedAt: "2026-11-23T09:15:00Z",
  },
  {
    id: "bkg_015",
    reference: "XC-261124-015",
    version: 1,
    lifecycleStatus: "CONFIRMED",
    vendorDecision: "ACCEPTED",
    paymentStatus: "CAPTURED",
    changeRequestStatus: "NONE",
    assignmentStatus: "ASSIGNED",
    assignedStaffName: "Marcus Concierge Lead",
    bookingMode: "CUSTOMER_DIRECT",
    customerId: "cus_004",
    customerName: "Liam Hayes",
    customerEmail: "liam.hayes@demo.com",
    customerLocation: "Brooklyn",
    serviceId: "srv_dining",
    serviceName: "Fine Dining · Manhattan",
    serviceCategory: "dining",
    vendorServiceId: "vs_chef_table",
    vendorServiceName: "Chef's Table VIP Reservation",
    destination: "Le Bernardin, Midtown",
    schedule: "2026-11-25T20:00:00",
    scheduleDisplay: "Nov 25 · 20:00",
    priceAmount: 340,
    currency: "USD",
    paymentSummaryDisplay: "USD 340 · Paid",
    dynamicFields: {
      guests: "2 guests",
      seating: "Main dining room window",
    },
    customerNotes: "Anniversary celebration",
    createdAt: "2026-11-22T11:20:00Z",
    updatedAt: "2026-11-22T16:00:00Z",
  },
  {
    id: "bkg_014",
    reference: "XC-261124-014",
    version: 1,
    lifecycleStatus: "CONFIRMED",
    vendorDecision: "ACCEPTED",
    paymentStatus: "CAPTURED",
    changeRequestStatus: "NONE",
    assignmentStatus: "ASSIGNED",
    assignedStaffName: "Elena Rostova",
    bookingMode: "CONCIERGE_ASSISTED",
    customerId: "cus_005",
    customerName: "Emma Davis",
    customerEmail: "emma.davis@demo.com",
    customerLocation: "Queens",
    serviceId: "srv_vip_meet",
    serviceName: "VIP Airport Meet & Greet",
    serviceCategory: "aviation",
    vendorServiceId: "vs_tarmac_escort",
    vendorServiceName: "Tarmac Escort & Fast Track",
    destination: "Teterboro Airport (TEB)",
    schedule: "2026-11-26T14:00:00",
    scheduleDisplay: "Nov 26 · 14:00",
    priceAmount: 450,
    currency: "USD",
    paymentSummaryDisplay: "USD 450 · Paid",
    dynamicFields: {
      tailNumber: "N789XC",
      luggagePieces: "4 bags",
    },
    customerNotes: "Private jet customs assistance",
    createdAt: "2026-11-21T08:00:00Z",
    updatedAt: "2026-11-21T12:00:00Z",
  },
];

const INITIAL_CHANGE_REQUESTS: BookingChangeRequest[] = [
  {
    id: "cr_018_1",
    bookingId: "bkg_018",
    type: "MODIFICATION",
    requestedChanges:
      "Reschedule pickup time from 07:30 EST to 09:30 EST due to flight itinerary update.",
    vendorDecision: "ACCEPTED",
    vendorNotes: "Driver vehicle re-allocated for 09:30 slot.",
    status: "PENDING_ADMIN",
    createdAt: "2026-11-24T06:15:00Z",
    createdDisplay: "Nov 24 · 06:15",
    proposedSchedule: "2026-11-24T09:30:00",
    proposedScheduleDisplay: "Nov 24, 2026 · 09:30 EST",
  },
  {
    id: "cr_018_2",
    bookingId: "bkg_018",
    type: "CANCELLATION",
    requestedChanges: "Guest emergency cancellation standby request due to meeting postponement.",
    vendorDecision: "ACCEPTED",
    vendorNotes: "Cancellation terms reviewed. No vendor penalty fee assessed.",
    status: "PENDING_ADMIN",
    createdAt: "2026-11-24T06:45:00Z",
    createdDisplay: "Nov 24 · 06:45",
  },
];

export class BookingRepository {
  private bookings: Booking[] = [];
  private changeRequests: BookingChangeRequest[] = [];
  private listeners: Set<() => void> = new Set();
  private nextSequence = 19;

  constructor() {
    this.resetDefaults();
  }

  public resetDefaults(): void {
    this.bookings = JSON.parse(JSON.stringify(INITIAL_BOOKINGS));
    this.changeRequests = JSON.parse(JSON.stringify(INITIAL_CHANGE_REQUESTS));
    this.nextSequence = 19;
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error("BookingRepository listener error:", err);
      }
    }
  }

  public listBookings(options: BookingFilterOptions = {}): BookingListResult {
    const {
      search = "",
      status = "All",
      serviceCategory = "All",
      page = 1,
      pageSize = 10,
    } = options;

    let filtered = [...this.bookings];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.reference.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.serviceName.toLowerCase().includes(q) ||
          b.destination.toLowerCase().includes(q),
      );
    }

    if (status !== "All") {
      filtered = filtered.filter((b) => b.lifecycleStatus === status);
    }

    if (serviceCategory !== "All") {
      filtered = filtered.filter((b) => b.serviceCategory === serviceCategory);
    }

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const validPage = Math.min(Math.max(1, page), totalPages);
    const start = (validPage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      totalCount,
      page: validPage,
      pageSize,
      totalPages,
    };
  }

  public getBookingById(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id || b.reference === id);
  }

  public getBookingByReference(reference: string): Booking | undefined {
    return this.bookings.find((b) => b.reference.toLowerCase() === reference.toLowerCase());
  }

  public createBooking(params: CreateBookingParams): Booking {
    const customer = customerRepository.getCustomerById(params.customerId);
    const customerName = customer
      ? `${customer.firstName} ${customer.lastName}`
      : "Valued Customer";
    const customerEmail = customer?.email || "customer@example.com";
    const customerLocation = customer?.location || "New York";

    const seqStr = String(this.nextSequence++).padStart(3, "0");
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const reference = `XC-${yy}${mm}${dd}-${seqStr}`;

    let serviceCategory: Booking["serviceCategory"] = "chauffeur";
    let serviceName = "Airport Transfer · JFK";
    let vendorServiceName = "Executive Sedan Pickup";
    let priceAmount = 185;

    if (params.serviceId === "srv_chef") {
      serviceCategory = "dining";
      serviceName = "Private Chef · Hamptons";
      vendorServiceName = "French Haute Cuisine Dinner";
      priceAmount = 650;
    } else if (params.serviceId === "srv_yacht") {
      serviceCategory = "yacht";
      serviceName = "Yacht Charter · Hudson";
      vendorServiceName = "Hudson River Sunset Cruise";
      priceAmount = 2400;
    } else if (params.serviceId === "srv_dining") {
      serviceCategory = "dining";
      serviceName = "Fine Dining · Manhattan";
      vendorServiceName = "Chef's Table VIP Reservation";
      priceAmount = 340;
    }

    const newBooking: Booking = {
      id: `bkg_${seqStr}`,
      reference,
      version: 1,
      lifecycleStatus: "PENDING_ADMIN",
      vendorDecision: "ACCEPTED",
      paymentStatus: "PAYMENT_DUE",
      changeRequestStatus: "NONE",
      assignmentStatus: "UNASSIGNED",
      bookingMode: "CONCIERGE_ASSISTED",
      customerId: params.customerId,
      customerName,
      customerEmail,
      customerLocation,
      serviceId: params.serviceId,
      serviceName,
      serviceCategory,
      vendorServiceId: params.vendorServiceId,
      vendorServiceName,
      tripId: params.tripId,
      destination: params.destination || "JFK Airport → Manhattan",
      schedule: params.schedule,
      scheduleDisplay: "Nov 25, 2026 · 10:00 EST",
      priceAmount,
      currency: params.currency || "USD",
      paymentSummaryDisplay: `${params.currency || "USD"} ${priceAmount} · Payment due`,
      dynamicFields: params.dynamicFields || { passengers: "2 passengers", luggage: "2 suitcases" },
      customerNotes: params.customerNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.unshift(newBooking);
    this.notify();
    return newBooking;
  }

  public confirmBooking(id: string, expectedVersion: number): Booking {
    const booking = this.getBookingById(id);
    if (!booking) {
      throw new Error(`Booking not found: ${id}`);
    }

    if (booking.version !== expectedVersion) {
      throw new StaleVersionConflictError(expectedVersion, booking.version);
    }

    booking.lifecycleStatus = "CONFIRMED";
    booking.version += 1;
    booking.updatedAt = new Date().toISOString();

    this.notify();
    return booking;
  }

  public updateBookingStatus(
    id: string,
    status: BookingLifecycleStatus,
    expectedVersion: number,
  ): Booking {
    const booking = this.getBookingById(id);
    if (!booking) {
      throw new Error(`Booking not found: ${id}`);
    }

    if (booking.version !== expectedVersion) {
      throw new StaleVersionConflictError(expectedVersion, booking.version);
    }

    booking.lifecycleStatus = status;
    booking.version += 1;
    booking.updatedAt = new Date().toISOString();

    this.notify();
    return booking;
  }

  public listChangeRequests(bookingId: string): BookingChangeRequest[] {
    const resolvedBooking = this.getBookingById(bookingId);
    const targetId = resolvedBooking?.id || bookingId;
    return this.changeRequests.filter((cr) => cr.bookingId === targetId);
  }

  public getChangeRequest(bookingId: string, requestId: string): BookingChangeRequest | undefined {
    const resolvedBooking = this.getBookingById(bookingId);
    const targetId = resolvedBooking?.id || bookingId;
    return this.changeRequests.find((cr) => cr.bookingId === targetId && cr.id === requestId);
  }

  public resolveChangeRequest(params: ResolveChangeRequestParams): {
    booking: Booking;
    changeRequest: BookingChangeRequest;
  } {
    const booking = this.getBookingById(params.bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${params.bookingId}`);
    }

    const changeRequest = this.getChangeRequest(booking.id, params.requestId);
    if (!changeRequest) {
      throw new Error(`Change request not found: ${params.requestId}`);
    }

    if (changeRequest.status !== "PENDING_ADMIN") {
      throw new Error(
        `Change request ${params.requestId} is already resolved (${changeRequest.status}).`,
      );
    }

    // Verify optimistic concurrency / authoritative version
    if (booking.version !== params.expectedVersion) {
      throw new StaleVersionConflictError(params.expectedVersion, booking.version);
    }

    const now = new Date().toISOString();

    if (params.decision === "APPROVE") {
      if (changeRequest.type === "MODIFICATION") {
        // Atomic modification application
        if (changeRequest.proposedSchedule) {
          booking.schedule = changeRequest.proposedSchedule;
          booking.scheduleDisplay =
            changeRequest.proposedScheduleDisplay || booking.scheduleDisplay;
        }
        if (changeRequest.proposedDestination) {
          booking.destination = changeRequest.proposedDestination;
        }
        booking.version += 1;
        booking.changeRequestStatus = "RESOLVED";
        booking.updatedAt = now;

        changeRequest.status = "RESOLVED";
        changeRequest.resolution = {
          decision: "APPROVE",
          reason: params.reason,
          resolvedBy: params.resolvedByRole,
          resolvedAt: now,
        };
      } else if (changeRequest.type === "CANCELLATION") {
        // Atomic cancellation application
        booking.lifecycleStatus = "CANCELLED";
        booking.assignmentStatus = "UNASSIGNED";
        booking.assignedStaffName = undefined;
        booking.version += 1;
        booking.changeRequestStatus = "RESOLVED";
        booking.updatedAt = now;
        // IMPORTANT: Payment state is intentionally isolated from cancellation!
        // No automatic refund calculation or trigger.

        changeRequest.status = "RESOLVED";
        changeRequest.resolution = {
          decision: "APPROVE",
          reason: params.reason,
          resolvedBy: params.resolvedByRole,
          resolvedAt: now,
        };
      }
    } else {
      // REJECT
      changeRequest.status = "REJECTED";
      changeRequest.resolution = {
        decision: "REJECT",
        reason: params.reason,
        resolvedBy: params.resolvedByRole,
        resolvedAt: now,
      };
      booking.changeRequestStatus = "REJECTED";
      booking.updatedAt = now;
    }

    this.notify();
    return { booking, changeRequest };
  }
}

export const bookingRepository = new BookingRepository();
