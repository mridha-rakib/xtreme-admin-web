import { AssetAllocationError, assetAllocationService } from "@/lib/mock/allocation";
import { UnauthorizedAssetAccessError, assetRepository } from "@/lib/mock/assets";
import { availabilityExceptionRepository } from "@/lib/mock/availability-exceptions";
import { StaleVersionConflictError, bookingRepository } from "@/lib/mock/bookings";
import type { AuthorizedActor } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";
import { availabilitySlotRepository } from "./../../src/lib/mock/availability-slots";

const ADMIN_ACTOR: AuthorizedActor = {
  id: "usr_admin",
  name: "Command Center Admin",
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

describe("AssetAllocationService & Mandatory Operational Preservation Regression Tests", () => {
  beforeEach(() => {
    assetRepository.resetDefaults();
    bookingRepository.resetDefaults();
    availabilityExceptionRepository.resetDefaults();
    availabilitySlotRepository.resetDefaults();
  });

  it("executes the mandatory 6-step asset maintenance & booking preservation scenario", () => {
    // 1. Verify active asset eligibility
    const assetBefore = assetRepository.getAssetById(ADMIN_ACTOR, "ast_001");
    expect(assetBefore?.status).toBe("ACTIVE");
    expect(assetBefore?.capacity).toBe(8);

    const eligibility = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 6);
    expect(eligibility.eligible).toBe(true);

    // 2. Verify allocation to confirmed booking succeeds
    const result = bookingRepository.listBookings({});
    const targetBooking = result.items[0];
    expect(targetBooking).toBeDefined();
    const targetBookingId = targetBooking.id;
    const originalBookingStatus = targetBooking.lifecycleStatus; // e.g. PENDING_ADMIN / CONFIRMED
    const originalPaymentStatus = targetBooking.paymentStatus;

    const allocation = assetAllocationService.allocateAssetToBooking(
      ADMIN_ACTOR,
      "ast_001",
      targetBookingId,
    );
    expect(allocation.assetId).toBe("ast_001");
    expect(allocation.bookingId).toBe(targetBookingId);

    // 3. Change asset status to MAINTENANCE -> checkAssetEligibility rejects new allocation
    const updateResult = assetRepository.updateAsset(ADMIN_ACTOR, "ast_001", {
      status: "MAINTENANCE",
    });
    expect(updateResult.asset.status).toBe("MAINTENANCE");
    expect(updateResult.operationalNotice).toBeDefined();

    const maintenanceEligibility = assetAllocationService.checkAssetEligibility(
      ADMIN_ACTOR,
      "ast_001",
      4,
    );
    expect(maintenanceEligibility.eligible).toBe(false);
    expect(maintenanceEligibility.reason).toContain("MAINTENANCE");

    // 4. Attempting allocateAssetToBooking throws AssetAllocationError
    const secondBookingId = result.items[1]?.id || "bkg_non_existent";
    expect(() =>
      assetAllocationService.allocateAssetToBooking(ADMIN_ACTOR, "ast_001", secondBookingId),
    ).toThrow(AssetAllocationError);

    // 5. Verify existing confirmed booking commitment remains completely intact
    const bookingAfterMaintenance = bookingRepository.getBookingById(targetBookingId);
    expect(bookingAfterMaintenance?.lifecycleStatus).toBe(originalBookingStatus);
    expect(bookingAfterMaintenance?.paymentStatus).toBe(originalPaymentStatus);

    const commitments = assetAllocationService.getActiveCommitmentsForAsset(ADMIN_ACTOR, "ast_001");
    expect(commitments.length).toBeGreaterThanOrEqual(1);
    expect(commitments[0].bookingId).toBe(targetBookingId);
    expect(commitments[0].preserved).toBe(true);

    // 6. Repeat with INACTIVE -> new allocation rejected, existing confirmed commitment preserved
    assetRepository.updateAsset(ADMIN_ACTOR, "ast_001", {
      status: "INACTIVE",
    });

    const inactiveEligibility = assetAllocationService.checkAssetEligibility(
      ADMIN_ACTOR,
      "ast_001",
      4,
    );
    expect(inactiveEligibility.eligible).toBe(false);
    expect(inactiveEligibility.reason).toContain("INACTIVE");

    expect(() =>
      assetAllocationService.allocateAssetToBooking(ADMIN_ACTOR, "ast_001", secondBookingId),
    ).toThrow(AssetAllocationError);

    const bookingAfterInactive = bookingRepository.getBookingById(targetBookingId);
    expect(bookingAfterInactive?.lifecycleStatus).toBe(originalBookingStatus);
    expect(bookingAfterInactive?.paymentStatus).toBe(originalPaymentStatus);
  });

  it("enforces tenant authorization and denies cross-vendor asset evaluation", () => {
    // ast_001 belongs to AeroJet (vnd_aerojet_99)
    // Vendor B (Côte d'Azur vnd_azure_01) must be denied
    expect(() => {
      assetAllocationService.checkAssetEligibility(VENDOR_B_ACTOR, "ast_001", 4);
    }).toThrow(UnauthorizedAssetAccessError);

    // Vendor A can check their own asset
    const vendorAElig = assetAllocationService.checkAssetEligibility(VENDOR_A_ACTOR, "ast_001", 4);
    expect(vendorAElig.eligible).toBe(true);
  });

  it("rejects new allocations during an active UNAVAILABLE exception", () => {
    // ast_003 has exception ex_001 UNAVAILABLE from 2026-12-24 to 2026-12-26
    const res = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_003", 6, {
      startsAt: "2026-12-25T10:00:00Z",
      endsAt: "2026-12-25T14:00:00Z",
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("UNAVAILABLE exception");
  });

  it("enforces CAPACITY_OVERRIDE exception payload limits", () => {
    // ast_001 has certified capacity 8, but ex_002 overrides capacity to 6 from 2026-12-15 to 2026-12-18
    const withinOverride = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 6, {
      startsAt: "2026-12-16T10:00:00Z",
      endsAt: "2026-12-16T12:00:00Z",
    });
    expect(withinOverride.eligible).toBe(true);

    const exceedsOverride = assetAllocationService.checkAssetEligibility(
      ADMIN_ACTOR,
      "ast_001",
      7,
      {
        startsAt: "2026-12-16T10:00:00Z",
        endsAt: "2026-12-16T12:00:00Z",
      },
    );
    expect(exceedsOverride.eligible).toBe(false);
    expect(exceedsOverride.reason).toContain("exceeds effective capacity");
  });

  it("rejects new allocations when an availability slot is CLOSED", () => {
    // slt_002 for ast_001 on 2026-11-26 14:00 to 18:00 is CLOSED
    const res = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 4, {
      startsAt: "2026-11-26T15:00:00Z",
      endsAt: "2026-11-26T17:00:00Z",
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("CLOSED");
  });

  it("enforces atomic optimistic locking and version check during booking allocation", () => {
    const bkg = bookingRepository.getBookingById("bkg_018");
    expect(bkg).toBeDefined();
    const currentVersion = bkg?.version ?? 3;

    // Stale version throws StaleVersionConflictError
    expect(() => {
      assetAllocationService.allocateAssetToBooking(
        ADMIN_ACTOR,
        "ast_001",
        "bkg_018",
        2,
        currentVersion - 1,
      );
    }).toThrow(StaleVersionConflictError);

    // Matching version increments version
    const alloc = assetAllocationService.allocateAssetToBooking(
      ADMIN_ACTOR,
      "ast_001",
      "bkg_018",
      2,
      currentVersion,
    );
    expect(alloc.booking.version).toBe(currentVersion + 1);
    expect(alloc.booking.assignmentStatus).toBe("ASSIGNED");
    expect(alloc.booking.dynamicFields.allocatedAssetId).toBe("ast_001");
  });
});
