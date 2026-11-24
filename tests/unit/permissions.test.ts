import { COMMAND_CENTER_NAV_ITEMS, getVisibleNavItems } from "@/lib/permissions";
import { COMMAND_CENTER_ROLE_PERMISSIONS, hasCommandCenterPermission } from "@/types";
import { describe, expect, it } from "vitest";

describe("Permissions and Navigation Governance", () => {
  describe("hasCommandCenterPermission", () => {
    it("grants all permissions to SUPER_ADMIN", () => {
      expect(hasCommandCenterPermission("SUPER_ADMIN", "view:dashboard")).toBe(true);
      expect(hasCommandCenterPermission("SUPER_ADMIN", "manage:system")).toBe(true);
      expect(hasCommandCenterPermission("SUPER_ADMIN", "manage:finance")).toBe(true);
    });

    it("denies system and finance mutations to CONCIERGE", () => {
      expect(hasCommandCenterPermission("CONCIERGE", "view:dashboard")).toBe(true);
      expect(hasCommandCenterPermission("CONCIERGE", "manage:bookings")).toBe(true);
      expect(hasCommandCenterPermission("CONCIERGE", "manage:system")).toBe(false);
      expect(hasCommandCenterPermission("CONCIERGE", "view:finance")).toBe(false);
    });

    it("restricts VENDOR to operational views only", () => {
      expect(hasCommandCenterPermission("VENDOR", "view:dashboard")).toBe(true);
      expect(hasCommandCenterPermission("VENDOR", "view:trips")).toBe(true);
      expect(hasCommandCenterPermission("VENDOR", "manage:customers")).toBe(false);
      expect(hasCommandCenterPermission("VENDOR", "manage:system")).toBe(false);
    });

    it("fails closed on null, undefined, or invalid roles", () => {
      expect(hasCommandCenterPermission(null, "view:dashboard")).toBe(false);
      expect(hasCommandCenterPermission(undefined, "view:dashboard")).toBe(false);
      // @ts-expect-error Testing invalid runtime role
      expect(hasCommandCenterPermission("ANONYMOUS_HACKER", "view:dashboard")).toBe(false);
    });
  });

  describe("getVisibleNavItems", () => {
    it("returns all items for SUPER_ADMIN", () => {
      const items = getVisibleNavItems("SUPER_ADMIN");
      expect(items.length).toBe(COMMAND_CENTER_NAV_ITEMS.length);
    });

    it("filters out system items for CONCIERGE", () => {
      const items = getVisibleNavItems("CONCIERGE");
      const ids = items.map((i) => i.id);
      expect(ids).toContain("dashboard");
      expect(ids).toContain("bookings");
      expect(ids).not.toContain("iam");
      expect(ids).not.toContain("audit-logs");
    });

    it("returns empty array for unauthenticated / null roles", () => {
      expect(getVisibleNavItems(null)).toEqual([]);
      expect(getVisibleNavItems(undefined)).toEqual([]);
    });
  });
});
