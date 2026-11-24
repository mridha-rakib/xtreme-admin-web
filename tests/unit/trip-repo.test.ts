import { TripValidationError, tripRepository } from "@/lib/mock/trips";
import { beforeEach, describe, expect, it } from "vitest";

describe("TripRepository Unit & Domain Model Tests", () => {
  beforeEach(() => {
    tripRepository.resetDefaults();
  });

  it("lists initial seeded trips with authoritative references and metadata", () => {
    const trips = tripRepository.listTrips();
    expect(trips.length).toBeGreaterThanOrEqual(3);

    const trip04 = tripRepository.getTripById("TRIP-261124-04");
    expect(trip04).toBeDefined();
    expect(trip04?.title).toBe("Thanksgiving in New York");
    expect(trip04?.customerName).toBe("Olivia Carter");
    expect(trip04?.destination).toBe("New York / Manhattan");
    expect(trip04?.status).toBe("OPEN");
    expect(trip04?.linkedBookingIds).toContain("bkg_018");
  });

  it("validates required fields on trip creation", () => {
    expect(() =>
      tripRepository.createTrip({
        customerId: "",
        title: "Test Trip",
        destination: "Dubai",
        startDate: "2026-12-01",
        endDate: "2026-12-05",
      }),
    ).toThrow(TripValidationError);

    expect(() =>
      tripRepository.createTrip({
        customerId: "cus_001",
        title: "",
        destination: "Dubai",
        startDate: "2026-12-01",
        endDate: "2026-12-05",
      }),
    ).toThrow(TripValidationError);
  });

  it("enforces start date <= end date on trip creation", () => {
    expect(() =>
      tripRepository.createTrip({
        customerId: "cus_001",
        title: "Invalid Timeline Trip",
        destination: "Tokyo",
        startDate: "2026-12-10",
        endDate: "2026-12-05", // Earlier than start date!
      }),
    ).toThrow("End date cannot be earlier than start date.");
  });

  it("successfully creates a trip container with resolved customer and dates display", () => {
    const created = tripRepository.createTrip({
      customerId: "cus_002",
      title: "Aspen Winter Ski Expedition",
      destination: "Aspen, Colorado",
      startDate: "2026-12-15",
      endDate: "2026-12-22",
      status: "OPEN",
      notes: "VIP chalet and ski rental required",
    });

    expect(created.id).toMatch(/^TRIP-261124-\d{2}$/);
    expect(created.customerName).toBe("Ethan Mitchell");
    expect(created.destination).toBe("Aspen, Colorado");
    expect(created.status).toBe("OPEN");
    expect(created.datesDisplay).toContain("Dec 15");
    expect(created.datesDisplay).toContain("Dec 22, 2026");
  });

  it("updates trip metadata and validates date order on update", () => {
    const updated = tripRepository.updateTrip("TRIP-261124-04", {
      title: "Thanksgiving in New York & Hamptons",
      status: "IN_PROGRESS",
    });

    expect(updated.title).toBe("Thanksgiving in New York & Hamptons");
    expect(updated.status).toBe("IN_PROGRESS");

    expect(() =>
      tripRepository.updateTrip("TRIP-261124-04", {
        startDate: "2026-11-29",
        endDate: "2026-11-20",
      }),
    ).toThrow("End date cannot be earlier than start date.");
  });
});
