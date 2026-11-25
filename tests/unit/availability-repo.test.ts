import {
  AvailabilityValidationError,
  UnauthorizedAvailabilityAccessError,
  availabilityRepository,
} from "@/lib/mock/availability";
import type { ApprovedTimezone, AuthorizedActor } from "@/types";
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

describe("AvailabilityRepository Scoped Multi-Tenant & Timezone Validation Tests", () => {
  beforeEach(() => {
    availabilityRepository.resetDefaults();
  });

  it("requires authenticated actor context for all operations", () => {
    expect(() => availabilityRepository.listRules(null)).toThrow(
      UnauthorizedAvailabilityAccessError,
    );
    expect(() => availabilityRepository.getRuleById(null, "avl_001")).toThrow(
      UnauthorizedAvailabilityAccessError,
    );
    expect(() =>
      availabilityRepository.createRule(null, {
        target: "Citation",
        weekday: "Mon - Fri",
        startTime: "08:00",
        endTime: "20:00",
        timezone: "Europe/Paris",
        capacity: 6,
      }),
    ).toThrow(UnauthorizedAvailabilityAccessError);
  });

  it("lists rules scoped to the authenticated Vendor organization", () => {
    const adminRules = availabilityRepository.listRules(ADMIN_ACTOR);
    expect(adminRules.length).toBe(7);

    const vendorARules = availabilityRepository.listRules(VENDOR_A_ACTOR);
    expect(vendorARules.length).toBe(2);
    expect(vendorARules.every((r) => r.vendorId === "vnd_aerojet_99")).toBe(true);

    const vendorBRules = availabilityRepository.listRules(VENDOR_B_ACTOR);
    expect(vendorBRules.length).toBe(2);
    expect(vendorBRules.every((r) => r.vendorId === "vnd_azure_01")).toBe(true);
  });

  it("strictly prevents Vendor actors from accessing or mutating other vendor rules", () => {
    // avl_003 is owned by Côte d'Azur (Vendor B)
    expect(() => availabilityRepository.getRuleById(VENDOR_A_ACTOR, "avl_003")).toThrow(
      UnauthorizedAvailabilityAccessError,
    );

    expect(() =>
      availabilityRepository.updateRule(VENDOR_A_ACTOR, "avl_003", {
        capacity: 10,
      }),
    ).toThrow(UnauthorizedAvailabilityAccessError);

    expect(() => availabilityRepository.toggleRuleActive(VENDOR_A_ACTOR, "avl_003", true)).toThrow(
      UnauthorizedAvailabilityAccessError,
    );
  });

  it("enforces canonical IANA timezone validation against approved timezones", () => {
    expect(() =>
      availabilityRepository.createRule(ADMIN_ACTOR, {
        target: "Test Target",
        weekday: "Mon - Fri",
        startTime: "08:00",
        endTime: "18:00",
        timezone: "Invalid/Timezone_Name" as unknown as ApprovedTimezone,
        capacity: 5,
      }),
    ).toThrow(/canonical IANA timezone/i);

    // Canonical approved timezone succeeds
    const created = availabilityRepository.createRule(ADMIN_ACTOR, {
      target: "VIP Chauffeur Contingent",
      weekday: "Daily",
      startTime: "06:00",
      endTime: "22:00",
      timezone: "Europe/Paris",
      capacity: 10,
      active: true,
    });
    expect(created.timezone).toBe("Europe/Paris");
    expect(created.timezoneDisplay).toBe("Europe/Paris (UTC+1)");
  });

  it("validates time formats (HH:mm) and ensures startTime is before endTime", () => {
    expect(() =>
      availabilityRepository.createRule(ADMIN_ACTOR, {
        target: "Test Target",
        weekday: "Mon - Fri",
        startTime: "25:00", // Invalid hour
        endTime: "18:00",
        timezone: "UTC",
        capacity: 5,
      }),
    ).toThrow(/HH:mm/i);

    expect(() =>
      availabilityRepository.createRule(ADMIN_ACTOR, {
        target: "Test Target",
        weekday: "Mon - Fri",
        startTime: "18:00",
        endTime: "08:00", // Start after end
        timezone: "UTC",
        capacity: 5,
      }),
    ).toThrow(/startTime.*must precede endTime/i);
  });

  it("returns defensive snapshot copies preventing internal state mutation", () => {
    const rule = availabilityRepository.getRuleById(ADMIN_ACTOR, "avl_001");
    expect(rule).toBeDefined();

    if (rule) {
      rule.target = "Tampered Rule";
    }

    const fetchedAgain = availabilityRepository.getRuleById(ADMIN_ACTOR, "avl_001");
    expect(fetchedAgain?.target).toContain("Cessna Citation Latitude");
  });
});
