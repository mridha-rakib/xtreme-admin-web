import {
  AvailabilityExceptionValidationError,
  UnauthorizedExceptionAccessError,
  availabilityExceptionRepository,
} from "@/lib/mock/availability-exceptions";
import type { AuthorizedActor } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";

const ADMIN_ACTOR: AuthorizedActor = {
  id: "usr_admin",
  name: "Command Center Admin",
  email: "admin@xtreme.internal",
  role: "ADMIN",
};

const VENDOR_A_ACTOR: AuthorizedActor = {
  id: "usr_vendor_a",
  name: "Arman K.",
  email: "arman@aerojet-partners.internal",
  role: "VENDOR",
  vendorId: "vnd_aerojet_99",
};

const VENDOR_B_ACTOR: AuthorizedActor = {
  id: "usr_vendor_b",
  name: "Claire Delacroix",
  email: "claire@cotedazur.internal",
  role: "VENDOR",
  vendorId: "vnd_azure_01",
};

describe("AvailabilityExceptionRepository Unit Tests", () => {
  beforeEach(() => {
    availabilityExceptionRepository.resetDefaults();
  });

  it("requires authenticated actor context for all operations", () => {
    expect(() => availabilityExceptionRepository.listExceptions(null)).toThrow(
      UnauthorizedExceptionAccessError,
    );
    expect(() => availabilityExceptionRepository.getExceptionById(null, "ex_001")).toThrow(
      UnauthorizedExceptionAccessError,
    );
    expect(() =>
      availabilityExceptionRepository.createException(null, {
        target: "Test Asset",
        startsAt: "2026-12-01T00:00:00Z",
        endsAt: "2026-12-02T00:00:00Z",
        type: "UNAVAILABLE",
        reason: "Test",
      }),
    ).toThrow(UnauthorizedExceptionAccessError);
  });

  it("enforces multi-tenant vendor scoping on listExceptions", () => {
    const all = availabilityExceptionRepository.listExceptions(ADMIN_ACTOR);
    expect(all.length).toBe(5);

    const vendorA = availabilityExceptionRepository.listExceptions(VENDOR_A_ACTOR);
    expect(vendorA.every((e) => e.vendorId === "vnd_aerojet_99")).toBe(true);

    const vendorB = availabilityExceptionRepository.listExceptions(VENDOR_B_ACTOR);
    expect(vendorB.every((e) => e.vendorId === "vnd_azure_01")).toBe(true);
  });

  it("prevents Vendor actors from accessing or mutating exceptions belonging to other vendors", () => {
    // ex_001 belongs to Côte d'Azur (Vendor B)
    expect(() =>
      availabilityExceptionRepository.getExceptionById(VENDOR_A_ACTOR, "ex_001"),
    ).toThrow(UnauthorizedExceptionAccessError);

    expect(() =>
      availabilityExceptionRepository.updateException(VENDOR_A_ACTOR, "ex_001", {
        reason: "Malicious update",
      }),
    ).toThrow(UnauthorizedExceptionAccessError);

    expect(() => availabilityExceptionRepository.deleteException(VENDOR_A_ACTOR, "ex_001")).toThrow(
      UnauthorizedExceptionAccessError,
    );
  });

  it("validates datetime ranges ensuring startsAt precedes endsAt", () => {
    expect(() =>
      availabilityExceptionRepository.createException(ADMIN_ACTOR, {
        target: "Asset X",
        startsAt: "2026-12-05T12:00:00Z",
        endsAt: "2026-12-05T10:00:00Z", // Earlier than startsAt
        type: "UNAVAILABLE",
        reason: "Inverted interval",
      }),
    ).toThrow(AvailabilityExceptionValidationError);
  });

  it("validates CAPACITY_OVERRIDE requires a non-negative capacity override", () => {
    expect(() =>
      availabilityExceptionRepository.createException(ADMIN_ACTOR, {
        target: "Asset X",
        startsAt: "2026-12-05T10:00:00Z",
        endsAt: "2026-12-05T18:00:00Z",
        type: "CAPACITY_OVERRIDE",
        reason: "Missing override",
      }),
    ).toThrow(AvailabilityExceptionValidationError);

    const valid = availabilityExceptionRepository.createException(ADMIN_ACTOR, {
      target: "Asset X",
      startsAt: "2026-12-05T10:00:00Z",
      endsAt: "2026-12-05T18:00:00Z",
      type: "CAPACITY_OVERRIDE",
      capacityOverride: 4,
      reason: "Reduced payload for mountainous route",
    });
    expect(valid.capacityOverride).toBe(4);
    expect(valid.type).toBe("CAPACITY_OVERRIDE");
  });

  it("supports updating and deleting exceptions", () => {
    const updated = availabilityExceptionRepository.updateException(ADMIN_ACTOR, "ex_001", {
      reason: "Extended holiday maintenance window",
    });
    expect(updated.reason).toBe("Extended holiday maintenance window");

    const deleted = availabilityExceptionRepository.deleteException(ADMIN_ACTOR, "ex_001");
    expect(deleted).toBe(true);

    const found = availabilityExceptionRepository.getExceptionById(ADMIN_ACTOR, "ex_001");
    expect(found).toBeUndefined();
  });
});
