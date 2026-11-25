import {
  AvailabilitySlotValidationError,
  UnauthorizedSlotAccessError,
  availabilitySlotRepository,
} from "@/lib/mock/availability-slots";
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

describe("AvailabilitySlotRepository Unit Tests", () => {
  beforeEach(() => {
    availabilitySlotRepository.resetDefaults();
  });

  it("requires authenticated actor context for all operations", () => {
    expect(() => availabilitySlotRepository.listSlots(null)).toThrow(UnauthorizedSlotAccessError);
    expect(() => availabilitySlotRepository.getSlotById(null, "slt_001")).toThrow(
      UnauthorizedSlotAccessError,
    );
    expect(() =>
      availabilitySlotRepository.createSlot(null, {
        target: "Test Asset",
        startsAt: "2026-11-26T08:00:00Z",
        endsAt: "2026-11-26T12:00:00Z",
        capacity: 8,
      }),
    ).toThrow(UnauthorizedSlotAccessError);
  });

  it("enforces multi-tenant vendor scoping on listSlots", () => {
    const all = availabilitySlotRepository.listSlots(ADMIN_ACTOR);
    expect(all.length).toBe(7);

    const vendorA = availabilitySlotRepository.listSlots(VENDOR_A_ACTOR);
    expect(vendorA.every((s) => s.vendorId === "vnd_aerojet_99")).toBe(true);

    const vendorB = availabilitySlotRepository.listSlots(VENDOR_B_ACTOR);
    expect(vendorB.every((s) => s.vendorId === "vnd_azure_01")).toBe(true);
  });

  it("prevents Vendor actors from modifying or deleting slots belonging to other vendors", () => {
    // slt_003 belongs to Côte d'Azur (Vendor B)
    expect(() => availabilitySlotRepository.getSlotById(VENDOR_A_ACTOR, "slt_003")).toThrow(
      UnauthorizedSlotAccessError,
    );

    expect(() =>
      availabilitySlotRepository.updateSlot(VENDOR_A_ACTOR, "slt_003", {
        capacity: 20,
      }),
    ).toThrow(UnauthorizedSlotAccessError);

    expect(() => availabilitySlotRepository.deleteSlot(VENDOR_A_ACTOR, "slt_003")).toThrow(
      UnauthorizedSlotAccessError,
    );
  });

  it("validates datetime ranges ensuring startsAt precedes endsAt", () => {
    expect(() =>
      availabilitySlotRepository.createSlot(ADMIN_ACTOR, {
        target: "Asset X",
        startsAt: "2026-11-26T18:00:00Z",
        endsAt: "2026-11-26T14:00:00Z",
        capacity: 4,
      }),
    ).toThrow(AvailabilitySlotValidationError);
  });

  it("validates positive capacity constraints", () => {
    expect(() =>
      availabilitySlotRepository.createSlot(ADMIN_ACTOR, {
        target: "Asset X",
        startsAt: "2026-11-26T08:00:00Z",
        endsAt: "2026-11-26T12:00:00Z",
        capacity: -2,
      }),
    ).toThrow(AvailabilitySlotValidationError);
  });

  it("supports toggling slot status between OPEN and CLOSED", () => {
    const slotBefore = availabilitySlotRepository.getSlotById(ADMIN_ACTOR, "slt_001");
    expect(slotBefore?.status).toBe("OPEN");

    const toggled = availabilitySlotRepository.toggleSlotStatus(ADMIN_ACTOR, "slt_001", "CLOSED");
    expect(toggled.status).toBe("CLOSED");

    const toggledAgain = availabilitySlotRepository.toggleSlotStatus(ADMIN_ACTOR, "slt_001");
    expect(toggledAgain.status).toBe("OPEN");
  });
});
