import { AvailabilityValidationError, availabilityRepository } from "@/lib/mock/availability";
import { beforeEach, describe, expect, it } from "vitest";

describe("AvailabilityRepository Unit Tests", () => {
  beforeEach(() => {
    availabilityRepository.resetDefaults();
  });

  it("lists all initial availability rules", () => {
    const rules = availabilityRepository.listRules();
    expect(rules.length).toBe(7);
  });

  it("filters rules by vendor, active status and search query", () => {
    const aerojetRules = availabilityRepository.listRules({ vendorId: "vnd_aerojet_99" });
    expect(aerojetRules.length).toBe(2);
    expect(aerojetRules.every((r) => r.vendorId === "vnd_aerojet_99")).toBe(true);

    const activeRules = availabilityRepository.listRules({ active: true });
    expect(activeRules.length).toBe(3);
    expect(activeRules.every((r) => r.active === true)).toBe(true);

    const inactiveRules = availabilityRepository.listRules({ active: false });
    expect(inactiveRules.length).toBe(4);
    expect(inactiveRules.every((r) => r.active === false)).toBe(true);

    const searchCitation = availabilityRepository.listRules({ search: "Citation" });
    expect(searchCitation.length).toBe(1);
    expect(searchCitation[0].target).toContain("Cessna Citation Latitude");
  });

  it("validates required fields on rule creation", () => {
    expect(() =>
      availabilityRepository.createRule({
        target: "",
        weekday: "Mon - Fri",
        timeWindow: "08:00 - 18:00",
        timezone: "UTC",
        capacity: 5,
      }),
    ).toThrow(AvailabilityValidationError);

    expect(() =>
      availabilityRepository.createRule({
        target: "Helicopter Fleet",
        weekday: "",
        timeWindow: "08:00 - 18:00",
        timezone: "UTC",
        capacity: 5,
      }),
    ).toThrow(AvailabilityValidationError);

    expect(() =>
      availabilityRepository.createRule({
        target: "Helicopter Fleet",
        weekday: "Daily",
        timeWindow: "08:00 - 18:00",
        timezone: "UTC",
        capacity: 0,
      }),
    ).toThrow(AvailabilityValidationError);
  });

  it("creates a new availability rule successfully", () => {
    const created = availabilityRepository.createRule({
      target: "VIP Chauffeur Contingent",
      targetType: "CATEGORY",
      weekday: "Daily",
      timeWindow: "24 Hours",
      timezone: "Europe/Paris (UTC+1)",
      capacity: 10,
      active: true,
      notes: "On-demand dispatch availability",
    });

    expect(created.id).toMatch(/^avl_/);
    expect(created.target).toBe("VIP Chauffeur Contingent");

    const found = availabilityRepository.getRuleById(created.id);
    expect(found).toBeDefined();
    expect(found?.capacity).toBe(10);
  });

  it("toggles active rule status and updates rule properties", () => {
    const rule = availabilityRepository.getRuleById("avl_001");
    expect(rule?.active).toBe(false);

    const toggled = availabilityRepository.toggleRuleActive("avl_001");
    expect(toggled.active).toBe(true);

    const updated = availabilityRepository.updateRule("avl_001", {
      timeWindow: "07:00 - 23:00",
      capacity: 10,
    });
    expect(updated.timeWindow).toBe("07:00 - 23:00");
    expect(updated.capacity).toBe(10);
  });
});
