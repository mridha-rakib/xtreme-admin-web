import { AssetAllocationError, assetAllocationService } from "@/lib/mock/allocation";
import { assetRepository } from "@/lib/mock/assets";
import { bookingRepository } from "@/lib/mock/bookings";
import type { AuthorizedActor } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";

const ADMIN_ACTOR: AuthorizedActor = {
  id: "usr_admin",
  name: "Command Center Admin",
  email: "admin@xtreme.internal",
  role: "ADMIN",
};

describe("AssetAllocationService & Mandatory Operational Preservation Regression Tests", () => {
  beforeEach(() => {
    assetRepository.resetDefaults();
    bookingRepository.resetDefaults();
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
});
