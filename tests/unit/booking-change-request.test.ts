import { bookingRepository } from "@/lib/mock/bookings";
import { beforeEach, describe, expect, it } from "vitest";

describe("Booking Change Request & Duplicate Guard Unit Tests", () => {
  beforeEach(() => {
    bookingRepository.resetDefaults();
  });

  it("correctly detects existing pending change request on bkg_018", () => {
    const hasPending = bookingRepository.hasPendingChangeRequest("bkg_018");
    expect(hasPending).toBe(true);

    const pending = bookingRepository.getPendingChangeRequest("bkg_018");
    expect(pending).toBeDefined();
    expect(pending?.status).toBe("PENDING_ADMIN");
    expect(pending?.type).toBe("MODIFICATION");
  });

  it("prevents creating duplicate pending change request on bkg_018", () => {
    expect(() =>
      bookingRepository.createChangeRequest({
        bookingId: "bkg_018",
        type: "CANCELLATION",
        reason: "Customer cancelled",
        requestedChanges: "Cancel booking",
      }),
    ).toThrow(/already exists.*Duplicate pending requests are strictly prevented/);
  });

  it("allows creating change request on booking without pending requests (bkg_017)", () => {
    expect(bookingRepository.hasPendingChangeRequest("bkg_017")).toBe(false);

    const created = bookingRepository.createChangeRequest({
      bookingId: "bkg_017",
      type: "MODIFICATION",
      reason: "Customer requested 1 hour later start time",
      requestedChanges: "Change start time to 20:00",
      proposedSchedule: "2026-11-24T20:00:00",
      submittedByRole: "CONCIERGE",
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe("PENDING_ADMIN");
    expect(created.type).toBe("MODIFICATION");

    const bkg017 = bookingRepository.getBookingById("bkg_017");
    expect(bkg017?.changeRequestStatus).toBe("PENDING_MODIFICATION");
    expect(bookingRepository.hasPendingChangeRequest("bkg_017")).toBe(true);
  });
});
