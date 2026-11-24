import {
  ConciergeValidationError,
  conciergeRequestRepository,
} from "@/lib/mock/concierge-requests";
import { beforeEach, describe, expect, it } from "vitest";

describe("ConciergeRequestRepository Unit & Domain Model Tests", () => {
  beforeEach(() => {
    conciergeRequestRepository.resetDefaults();
  });

  it("lists initial seeded requests matching authoritative Figma references", () => {
    const requests = conciergeRequestRepository.listRequests();
    expect(requests.length).toBeGreaterThanOrEqual(3);

    const cr001 = conciergeRequestRepository.getRequestById("cr_001");
    expect(cr001).toBeDefined();
    expect(cr001?.reference).toBe("CR-261124-01");
    expect(cr001?.customerName).toBe("Olivia Carter");
    expect(cr001?.type).toBe("PLAN_TRIP");
    expect(cr001?.status).toBe("OPEN");
    expect(cr001?.assignedStaffName).toBe("Elena Rostova");
  });

  it("filters concierge requests by type, status, and query", () => {
    const tripPlans = conciergeRequestRepository.listRequests({ type: "PLAN_TRIP" });
    expect(tripPlans.every((r) => r.type === "PLAN_TRIP")).toBe(true);

    const openRequests = conciergeRequestRepository.listRequests({ status: "OPEN" });
    expect(openRequests.every((r) => r.status === "OPEN")).toBe(true);

    const searchRes = conciergeRequestRepository.listRequests({ search: "Sophia" });
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].customerName).toBe("Sophia Reed");
  });

  it("validates required fields on request creation", () => {
    expect(() =>
      conciergeRequestRepository.createRequest({
        customerId: "",
        type: "PLAN_TRIP",
        details: "Test details",
      }),
    ).toThrow(ConciergeValidationError);

    expect(() =>
      conciergeRequestRepository.createRequest({
        customerId: "cus_001",
        type: "PLAN_TRIP",
        details: "   ",
      }),
    ).toThrow(ConciergeValidationError);
  });

  it("successfully creates a concierge request with resolved customer and trip context", () => {
    const created = conciergeRequestRepository.createRequest({
      customerId: "cus_002",
      tripId: "TRIP-261124-02",
      type: "SERVICE_REQUEST",
      serviceName: "Yacht Harbor Tender",
      details: "Arrange tender transport for 4 passengers from harbor to marina estate.",
      assignedStaffName: "Marcus Vance",
    });

    expect(created.reference).toMatch(/^CR-\d{6}-\d{2}$/);
    expect(created.customerName).toBe("Ethan Mitchell");
    expect(created.status).toBe("OPEN");
    expect(created.type).toBe("SERVICE_REQUEST");
    expect(created.tripId).toBe("TRIP-261124-02");
    expect(created.serviceName).toBe("Yacht Harbor Tender");
  });

  it("updates request status and assigned staff", () => {
    const updated = conciergeRequestRepository.updateRequest("cr_001", {
      status: "IN_PROGRESS",
      assignedStaffName: "Marcus Vance",
      details: "Updated instructions: private aviation desk notified.",
    });

    expect(updated.status).toBe("IN_PROGRESS");
    expect(updated.assignedStaffName).toBe("Marcus Vance");
    expect(updated.details).toContain("private aviation desk notified");
  });
});
