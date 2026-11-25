import { assetAllocationService } from "@/lib/mock/allocation";
import { assetRepository } from "@/lib/mock/assets";
import { availabilityRepository } from "@/lib/mock/availability";
import { availabilityExceptionRepository } from "@/lib/mock/availability-exceptions";
import { availabilitySlotRepository } from "@/lib/mock/availability-slots";
import {
  BookingAllocationError,
  StaleVersionConflictError,
  UnauthorizedBookingAccessError,
  bookingRepository,
} from "@/lib/mock/bookings";
import type { AuthorizedActor } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";

const ADMIN_ACTOR: AuthorizedActor = {
  id: "usr_admin",
  name: "Operations Admin",
  email: "admin@xtreme.internal",
  role: "ADMIN",
};

const VENDOR_A_ACTOR: AuthorizedActor = {
  id: "usr_vendor_a",
  name: "Arman K.",
  email: "arman@aerojet.com",
  role: "VENDOR",
  vendorId: "vnd_aerojet_99",
};

const VENDOR_B_ACTOR: AuthorizedActor = {
  id: "usr_vendor_b",
  name: "Jean-Paul B.",
  email: "jp@cotedazurmarine.com",
  role: "VENDOR",
  vendorId: "vnd_azure_01",
};

describe("Comprehensive Allocation & Availability Preflight Verification", () => {
  beforeEach(() => {
    assetRepository.resetDefaults();
    bookingRepository.resetDefaults();
    availabilityRepository.resetDefaults();
    availabilityExceptionRepository.resetDefaults();
    availabilitySlotRepository.resetDefaults();
  });

  it("1. Recurring rule rejects an outside-hours allocation and accepts in-hours", () => {
    // Activate avl_001 for ast_001: Mon-Fri 08:00-18:00 Europe/Paris
    availabilityRepository.updateRule(ADMIN_ACTOR, "avl_001", {
      active: true,
      startTime: "08:00",
      endTime: "18:00",
    });

    // 2026-11-25 is a Wednesday. 02:00 Europe/Paris (01:00 UTC) is outside 08:00-18:00
    const outsideHours = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 2, {
      startsAt: "2026-11-25T01:00:00Z",
      endsAt: "2026-11-25T03:00:00Z",
    });
    expect(outsideHours.eligible).toBe(false);
    expect(outsideHours.reason).toContain("outside approved operating hours");

    // 2026-11-25 at 12:00 Europe/Paris (11:00 UTC) is within 08:00-18:00
    const inHours = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 2, {
      startsAt: "2026-11-25T10:00:00Z",
      endsAt: "2026-11-25T12:00:00Z",
    });
    expect(inHours.eligible).toBe(true);
  });

  it("2. Invalid or missing required scheduling information is rejected", () => {
    // Missing endsAt
    const missingEnd = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 2, {
      startsAt: "2026-11-25T10:00:00Z",
      endsAt: "",
    });
    expect(missingEnd.eligible).toBe(false);
    expect(missingEnd.reason).toContain("Scheduling interval must provide both");

    // Inverted interval (startsAt after endsAt)
    const inverted = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 2, {
      startsAt: "2026-11-25T15:00:00Z",
      endsAt: "2026-11-25T14:00:00Z",
    });
    expect(inverted.eligible).toBe(false);
    expect(inverted.reason).toContain("startsAt must strictly precede endsAt");
  });

  it("3. Non-overlapping intervals can be distinguished from overlapping intervals", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();

    // Allocate ast_001 to bkg_018 from 10:00 to 12:00 UTC
    assetAllocationService.allocateAssetToBooking(
      ADMIN_ACTOR,
      "ast_001",
      "bkg_018",
      {
        startsAt: "2026-11-25T10:00:00Z",
        endsAt: "2026-11-25T12:00:00Z",
      },
      bkg?.version,
    );

    // Overlapping interval (11:00 to 13:00) -> rejected
    const overlap = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 2, {
      startsAt: "2026-11-25T11:00:00Z",
      endsAt: "2026-11-25T13:00:00Z",
    });
    expect(overlap.eligible).toBe(false);
    expect(overlap.reason).toContain("Active allocation conflict");

    // Non-overlapping interval later the same day (14:00 to 16:00) -> eligible
    const nonOverlap = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 2, {
      startsAt: "2026-11-25T14:00:00Z",
      endsAt: "2026-11-25T16:00:00Z",
    });
    expect(nonOverlap.eligible).toBe(true);
  });

  it("4. Capacity is correctly evaluated and limited", () => {
    // ast_001 certified physical capacity is 8
    const exceedsPhysical = assetAllocationService.checkAssetEligibility(
      ADMIN_ACTOR,
      "ast_001",
      10,
    );
    expect(exceedsPhysical.eligible).toBe(false);
    expect(exceedsPhysical.reason).toContain("exceeds effective capacity");
  });

  it("5. OPEN slot capacity is enforced", () => {
    // ast_001 has capacity 8. Create an OPEN slot with restricted capacity 4
    availabilitySlotRepository.createSlot(ADMIN_ACTOR, {
      target: "Cessna Citation Latitude (AST-AJ-01)",
      targetId: "ast_001",
      startsAt: "2026-11-27T08:00:00Z",
      endsAt: "2026-11-27T12:00:00Z",
      capacity: 4,
      status: "OPEN",
      notes: "High-density cargo weight restriction",
    });

    // Requesting 4 pax succeeds
    const withinSlot = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 4, {
      startsAt: "2026-11-27T09:00:00Z",
      endsAt: "2026-11-27T11:00:00Z",
    });
    expect(withinSlot.eligible).toBe(true);

    // Requesting 5 pax exceeds the slot limit of 4
    const exceedsSlot = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 5, {
      startsAt: "2026-11-27T09:00:00Z",
      endsAt: "2026-11-27T11:00:00Z",
    });
    expect(exceedsSlot.eligible).toBe(false);
    expect(exceedsSlot.reason).toContain("exceeds effective capacity");
  });

  it("6. CLOSED slot blocks new allocations", () => {
    // slt_002 for ast_001 is CLOSED on 2026-11-26 14:00 to 18:00
    const closedRes = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 2, {
      startsAt: "2026-11-26T15:00:00Z",
      endsAt: "2026-11-26T17:00:00Z",
    });
    expect(closedRes.eligible).toBe(false);
    expect(closedRes.reason).toContain("is CLOSED");
  });

  it("7. AVAILABLE_OVERRIDE cannot bypass an active conflict", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();

    // Commit ast_001 to bkg_018 from 10:00 to 12:00 UTC
    assetAllocationService.allocateAssetToBooking(
      ADMIN_ACTOR,
      "ast_001",
      "bkg_018",
      {
        startsAt: "2026-11-25T10:00:00Z",
        endsAt: "2026-11-25T12:00:00Z",
      },
      bkg?.version,
    );

    // Create an AVAILABLE_OVERRIDE exception covering that period
    availabilityExceptionRepository.createException(ADMIN_ACTOR, {
      target: "Cessna Citation Latitude (AST-AJ-01)",
      targetId: "ast_001",
      type: "AVAILABLE_OVERRIDE",
      startsAt: "2026-11-25T08:00:00Z",
      endsAt: "2026-11-25T18:00:00Z",
      reason: "VIP Special Dispensation",
    });

    // Attempting allocation on the conflicting interval still fails!
    const conflictRes = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 2, {
      startsAt: "2026-11-25T10:30:00Z",
      endsAt: "2026-11-25T11:30:00Z",
    });
    expect(conflictRes.eligible).toBe(false);
    expect(conflictRes.reason).toContain("Overrides cannot bypass active allocation conflicts");
  });

  it("8. MAINTENANCE and INACTIVE assets reject new allocations", () => {
    // ast_002 is MAINTENANCE in seed
    const maintRes = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_002", 2);
    expect(maintRes.eligible).toBe(false);
    expect(maintRes.reason).toContain("MAINTENANCE");

    // ast_004 is INACTIVE in seed
    const inactiveRes = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_004", 2);
    expect(inactiveRes.eligible).toBe(false);
    expect(inactiveRes.reason).toContain("INACTIVE");
  });

  it("9. Vendor A cannot allocate Vendor B's assets or bookings", () => {
    const bkg17 = bookingRepository.getBookingById("bkg_017");
    expect(bkg17).toBeDefined();

    // ast_003 belongs to vnd_azure_01 (Vendor B)
    // bkg_017 is a dining booking (Antoine Dupont)
    // Vendor A attempting to allocate Vendor B's asset -> rejected
    expect(() => {
      bookingRepository.allocateAssetToBooking(
        VENDOR_A_ACTOR,
        "bkg_017",
        {
          assetId: "ast_003",
          assetCode: "AST-CY-01",
          assetName: "Sunseeker Predator 74",
          vendorId: "vnd_azure_01",
          allocatedStartsAt: "2026-11-25T10:00:00Z",
          allocatedEndsAt: "2026-11-25T12:00:00Z",
        },
        bkg17?.version || 1,
      );
    }).toThrow(UnauthorizedBookingAccessError);

    // Vendor B attempting to allocate to Vendor A's asset on bkg_017 -> rejected
    expect(() => {
      bookingRepository.allocateAssetToBooking(
        VENDOR_B_ACTOR,
        "bkg_017",
        {
          assetId: "ast_001",
          assetCode: "AST-AJ-01",
          assetName: "Cessna Citation",
          vendorId: "vnd_aerojet_99",
          allocatedStartsAt: "2026-11-25T10:00:00Z",
          allocatedEndsAt: "2026-11-25T12:00:00Z",
        },
        bkg17?.version || 1,
      );
    }).toThrow(UnauthorizedBookingAccessError);
  });

  it("10. Direct repository calls cannot bypass required version or interval", () => {
    // Missing version
    expect(() => {
      // @ts-expect-error testing missing expectedVersion
      bookingRepository.allocateAssetToBooking(ADMIN_ACTOR, "bkg_017", {
        assetId: "ast_001",
        assetCode: "AST-AJ-01",
        assetName: "Cessna Citation",
        allocatedStartsAt: "2026-11-25T10:00:00Z",
        allocatedEndsAt: "2026-11-25T12:00:00Z",
      });
    }).toThrow(BookingAllocationError);

    // Missing interval
    expect(() => {
      bookingRepository.allocateAssetToBooking(
        ADMIN_ACTOR,
        "bkg_017",
        {
          assetId: "ast_001",
          assetCode: "AST-AJ-01",
          assetName: "Cessna Citation",
          allocatedStartsAt: "",
          allocatedEndsAt: "",
        },
        1,
      );
    }).toThrow(BookingAllocationError);
  });

  it("11. Stale Booking version is rejected with StaleVersionConflictError", () => {
    const bkg = bookingRepository.getBookingById("bkg_017");
    expect(bkg).toBeDefined();

    expect(() => {
      bookingRepository.allocateAssetToBooking(
        ADMIN_ACTOR,
        "bkg_017",
        {
          assetId: "ast_001",
          assetCode: "AST-AJ-01",
          assetName: "Cessna Citation",
          allocatedStartsAt: "2026-11-25T10:00:00Z",
          allocatedEndsAt: "2026-11-25T12:00:00Z",
        },
        (bkg?.version || 1) + 99,
      );
    }).toThrow(StaleVersionConflictError);
  });

  it("12. Confirmed Booking and its actual allocation remain unchanged after configuration changes", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();

    // Allocate ast_001 to bkg_018
    const allocated = assetAllocationService.allocateAssetToBooking(
      ADMIN_ACTOR,
      "ast_001",
      "bkg_018",
      {
        startsAt: "2026-11-25T10:00:00Z",
        endsAt: "2026-11-25T12:00:00Z",
      },
      bkg?.version,
    );
    expect(allocated.booking.dynamicFields.allocatedAssetId).toBe("ast_001");

    // Later, asset status is changed to MAINTENANCE
    assetRepository.updateAsset(ADMIN_ACTOR, "ast_001", {
      status: "MAINTENANCE",
    });

    // The existing confirmed commitment is preserved and unchanged!
    const retrieved = bookingRepository.getBookingById("bkg_018");
    expect(retrieved?.dynamicFields.allocatedAssetId).toBe("ast_001");
    expect(retrieved?.assignmentStatus).toBe("ASSIGNED");

    const commitments = assetAllocationService.getActiveCommitmentsForAsset(ADMIN_ACTOR, "ast_001");
    expect(commitments.some((c) => c.bookingId === "bkg_018")).toBe(true);
  });

  it("13. Failed operations leave repository state completely unchanged", () => {
    const before = bookingRepository.getBookingById("bkg_017");
    const beforeVersion = before?.version;
    const beforeUpdated = before?.updatedAt;

    expect(() => {
      bookingRepository.allocateAssetToBooking(
        ADMIN_ACTOR,
        "bkg_017",
        {
          assetId: "ast_001",
          assetCode: "AST-AJ-01",
          assetName: "Cessna Citation",
          allocatedStartsAt: "2026-11-25T10:00:00Z",
          allocatedEndsAt: "2026-11-25T12:00:00Z",
        },
        999, // wrong version
      );
    }).toThrow();

    const after = bookingRepository.getBookingById("bkg_017");
    expect(after?.version).toBe(beforeVersion);
    expect(after?.updatedAt).toBe(beforeUpdated);
  });
});
