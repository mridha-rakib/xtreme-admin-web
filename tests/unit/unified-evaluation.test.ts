import { assetAllocationService } from "@/lib/mock/allocation";
import { assetRepository } from "@/lib/mock/assets";
import { availabilityRepository } from "@/lib/mock/availability";
import { availabilityExceptionRepository } from "@/lib/mock/availability-exceptions";
import { availabilitySlotRepository } from "@/lib/mock/availability-slots";
import { bookingRepository } from "@/lib/mock/bookings";
import type { AuthorizedActor } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";

const ADMIN_ACTOR: AuthorizedActor = {
  id: "usr_admin",
  name: "Command Center Admin",
  email: "admin@xtreme.internal",
  role: "ADMIN",
};

describe("Unified Availability & Allocation Integration Tests", () => {
  beforeEach(() => {
    assetRepository.resetDefaults();
    availabilityRepository.resetDefaults();
    availabilityExceptionRepository.resetDefaults();
    availabilitySlotRepository.resetDefaults();
    bookingRepository.resetDefaults();
  });

  it("evaluates interval against UNAVAILABLE exception and rejects allocation", () => {
    // ast_003 (Sunseeker Predator 74) has UNAVAILABLE exception ex_001 from 2026-12-24 to 2026-12-26
    const res = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_003", 6, {
      startsAt: "2026-12-24T10:00:00Z",
      endsAt: "2026-12-24T16:00:00Z",
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("UNAVAILABLE exception");
  });

  it("evaluates interval with CAPACITY_OVERRIDE and respects adjusted maximum", () => {
    // ast_001 has ex_002 overriding capacity to 6 pax from 2026-12-15 to 2026-12-18
    const pass = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 5, {
      startsAt: "2026-12-16T10:00:00Z",
      endsAt: "2026-12-16T14:00:00Z",
    });
    expect(pass.eligible).toBe(true);
    expect(pass.effectiveCapacity).toBe(6);

    const fail = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 7, {
      startsAt: "2026-12-16T10:00:00Z",
      endsAt: "2026-12-16T14:00:00Z",
    });
    expect(fail.eligible).toBe(false);
    expect(fail.reason).toContain("exceeds effective capacity");
  });

  it("AVAILABLE_OVERRIDE cannot bypass MAINTENANCE or INACTIVE status", () => {
    // ast_005 (Mercedes-Maybach S680) has AVAILABLE_OVERRIDE ex_003 on 2026-12-31 to 2027-01-01
    // When ast_005 is ACTIVE, it is eligible
    const activeCheck = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_005", 2, {
      startsAt: "2026-12-31T20:00:00Z",
      endsAt: "2026-12-31T23:00:00Z",
    });
    expect(activeCheck.eligible).toBe(true);

    // If placed in MAINTENANCE, override CANNOT bypass maintenance
    assetRepository.updateAsset(ADMIN_ACTOR, "ast_005", { status: "MAINTENANCE" });
    const maintCheck = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_005", 2, {
      startsAt: "2026-12-31T20:00:00Z",
      endsAt: "2026-12-31T23:00:00Z",
    });
    expect(maintCheck.eligible).toBe(false);
    expect(maintCheck.reason).toContain("MAINTENANCE");
  });

  it("evaluates CLOSED slot and blocks new allocation", () => {
    // slt_002 for ast_001 is CLOSED on 2026-11-26 14:00 to 18:00
    const res = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 4, {
      startsAt: "2026-11-26T15:00:00Z",
      endsAt: "2026-11-26T17:00:00Z",
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("CLOSED");
  });

  it("detects active booking conflicts preventing double allocation", () => {
    // Allocate ast_001 to bkg_018 at 2026-11-24T07:30:00
    assetAllocationService.allocateAssetToBooking(ADMIN_ACTOR, "ast_001", "bkg_018");

    // Second booking bkg_016 schedule is 2026-11-24T08:00:00 (overlapping within 3 hours)
    const conflictRes = assetAllocationService.checkAssetEligibility(ADMIN_ACTOR, "ast_001", 2, {
      startsAt: "2026-11-24T08:00:00",
      endsAt: "2026-11-24T10:00:00",
    });
    expect(conflictRes.eligible).toBe(false);
    expect(conflictRes.reason).toContain("Active allocation conflict");
  });
});
