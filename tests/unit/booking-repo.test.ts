import { StaleVersionConflictError, bookingRepository } from "@/lib/mock/bookings";
import { beforeEach, describe, expect, it } from "vitest";

describe("BookingRepository Unit & Domain Model Tests", () => {
  beforeEach(() => {
    bookingRepository.resetDefaults();
  });

  it("lists initial seeded bookings matching authoritative Figma reference", () => {
    const res = bookingRepository.listBookings();
    expect(res.totalCount).toBeGreaterThanOrEqual(5);

    // CC-BKG-02 reference booking
    const bkg018 = bookingRepository.getBookingById("bkg_018");
    expect(bkg018).toBeDefined();
    expect(bkg018?.reference).toBe("XC-261124-018");
    expect(bkg018?.version).toBe(3);
    expect(bkg018?.lifecycleStatus).toBe("PENDING_ADMIN");
    expect(bkg018?.vendorDecision).toBe("ACCEPTED");
    expect(bkg018?.paymentStatus).toBe("PAYMENT_DUE");
    expect(bkg018?.changeRequestStatus).toBe("PENDING_MODIFICATION");
  });

  it("filters bookings by search query across reference, customer and destination", () => {
    const searchRef = bookingRepository.listBookings({ search: "XC-261124-018" });
    expect(searchRef.items.length).toBe(1);
    expect(searchRef.items[0].reference).toBe("XC-261124-018");

    const searchCust = bookingRepository.listBookings({ search: "Sophia" });
    expect(searchCust.items.length).toBe(1);
    expect(searchCust.items[0].customerName).toBe("Sophia Reed");
  });

  it("filters bookings by lifecycle status and service category", () => {
    const confirmed = bookingRepository.listBookings({ status: "CONFIRMED" });
    expect(confirmed.items.every((b) => b.lifecycleStatus === "CONFIRMED")).toBe(true);

    const yachts = bookingRepository.listBookings({ serviceCategory: "yacht" });
    expect(yachts.items.length).toBe(1);
    expect(yachts.items[0].serviceName).toContain("Yacht Charter");
  });

  it("creates a new booking on behalf with unique reference and initial v1 state", () => {
    const newBkg = bookingRepository.createBooking({
      customerId: "cus_001",
      serviceId: "srv_airport",
      vendorServiceId: "Executive Sedan Pickup",
      tripId: "TRIP-261124-04",
      destination: "Newark Liberty Airport",
      schedule: "2026-11-26T14:00:00",
      dynamicFields: { passengers: "3", bags: "3" },
      customerNotes: "Meet curbside",
    });

    expect(newBkg.reference).toMatch(/^XC-\d{6}-\d{3}$/);
    expect(newBkg.version).toBe(1);
    expect(newBkg.lifecycleStatus).toBe("PENDING_ADMIN");
    expect(newBkg.vendorDecision).toBe("ACCEPTED");
    expect(newBkg.customerName).toBe("Olivia Carter");
    expect(newBkg.destination).toBe("Newark Liberty Airport");

    // Listed in repository
    const found = bookingRepository.getBookingById(newBkg.id);
    expect(found).toBeDefined();
  });

  it("confirms a booking and increments authoritative version", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();
    if (!bkg) return;
    const initialVersion = bkg.version;

    const confirmed = bookingRepository.confirmBooking(bkg.id, initialVersion);
    expect(confirmed.lifecycleStatus).toBe("CONFIRMED");
    expect(confirmed.version).toBe(initialVersion + 1);
  });

  it("throws StaleVersionConflictError (409) if expectedVersion does not match currentVersion", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();
    if (!bkg) return;
    const wrongVersion = bkg.version + 99;

    expect(() => {
      bookingRepository.confirmBooking(bkg.id, wrongVersion);
    }).toThrow(StaleVersionConflictError);
  });

  it("approves a modification change request: atomically updates schedule and increments version", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();
    if (!bkg) return;
    const versionBefore = bkg.version;

    const { booking: updated, changeRequest: cr } = bookingRepository.resolveChangeRequest({
      bookingId: bkg.id,
      requestId: "cr_018_1",
      expectedVersion: versionBefore,
      decision: "APPROVE",
      reason: "Driver schedule verified and re-allocated.",
      resolvedByRole: "ADMIN",
    });

    expect(cr.status).toBe("RESOLVED");
    expect(cr.resolution?.decision).toBe("APPROVE");
    expect(updated.version).toBe(versionBefore + 1);
    expect(updated.schedule).toBe("2026-11-24T09:30:00");
    expect(updated.changeRequestStatus).toBe("RESOLVED");
  });

  it("approves a cancellation request: cancels booking without altering payment status (payment isolation)", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();
    if (!bkg) return;
    const paymentStatusBefore = bkg.paymentStatus;
    const versionBefore = bkg.version;

    const { booking: updated, changeRequest: cr } = bookingRepository.resolveChangeRequest({
      bookingId: bkg.id,
      requestId: "cr_018_2",
      expectedVersion: versionBefore,
      decision: "APPROVE",
      reason: "Emergency cancellation approved under policy.",
      resolvedByRole: "SUPER_ADMIN",
    });

    expect(cr.status).toBe("RESOLVED");
    expect(updated.lifecycleStatus).toBe("CANCELLED");
    expect(updated.version).toBe(versionBefore + 1);
    // Crucial rule: Payment status is completely isolated from operational cancellation
    expect(updated.paymentStatus).toBe(paymentStatusBefore);
  });

  it("rejects a change request and preserves original booking details", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();
    if (!bkg) return;
    const scheduleBefore = bkg.schedule;
    const versionBefore = bkg.version;

    const { booking: updated, changeRequest: cr } = bookingRepository.resolveChangeRequest({
      bookingId: bkg.id,
      requestId: "cr_018_1",
      expectedVersion: versionBefore,
      decision: "REJECT",
      reason: "Fleet unavailable at requested new time slot.",
      resolvedByRole: "ADMIN",
    });

    expect(cr.status).toBe("REJECTED");
    expect(updated.schedule).toBe(scheduleBefore);
    expect(updated.changeRequestStatus).toBe("REJECTED");
  });

  it("prevents duplicate resolution of already resolved change request", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();
    if (!bkg) return;

    bookingRepository.resolveChangeRequest({
      bookingId: bkg.id,
      requestId: "cr_018_1",
      expectedVersion: bkg.version,
      decision: "APPROVE",
      reason: "Approved.",
      resolvedByRole: "ADMIN",
    });

    expect(() => {
      bookingRepository.resolveChangeRequest({
        bookingId: bkg.id,
        requestId: "cr_018_1",
        expectedVersion: bkg.version,
        decision: "APPROVE",
        reason: "Duplicate attempt.",
        resolvedByRole: "ADMIN",
      });
    }).toThrow(/already resolved/);
  });
});
