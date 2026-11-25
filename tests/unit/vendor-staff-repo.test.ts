import {
  UnauthorizedStaffAccessError,
  VendorStaffValidationError,
  vendorStaffRepository,
} from "@/lib/mock/vendor-staff";
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

describe("VendorStaffRepository Scoped Multi-Tenant Authorization Tests", () => {
  beforeEach(() => {
    vendorStaffRepository.resetDefaults();
  });

  it("requires authenticated actor context for all operations", () => {
    expect(() => vendorStaffRepository.listStaff(null)).toThrow(UnauthorizedStaffAccessError);
    expect(() => vendorStaffRepository.getStaffById(null, "stf_001")).toThrow(
      UnauthorizedStaffAccessError,
    );
    expect(() =>
      vendorStaffRepository.associateStaff(null, {
        identityId: "ident_010",
        staffType: "PILOT",
        employeeCode: "AJ-9999",
      }),
    ).toThrow(UnauthorizedStaffAccessError);
  });

  it("lists staff strictly scoped to the authenticated Vendor organization", () => {
    const aerojetStaff = vendorStaffRepository.listStaff(VENDOR_A_ACTOR);
    expect(aerojetStaff.length).toBe(7);
    expect(aerojetStaff.every((s) => s.vendorId === "vnd_aerojet_99")).toBe(true);

    const azureStaff = vendorStaffRepository.listStaff(VENDOR_B_ACTOR);
    expect(azureStaff.length).toBe(2);
    expect(azureStaff.every((s) => s.vendorId === "vnd_azure_01")).toBe(true);
  });

  it("strictly prevents cross-vendor staff access", () => {
    // Vendor A attempting to access Vendor B's staff record throws UnauthorizedStaffAccessError
    expect(() => vendorStaffRepository.getStaffById(VENDOR_A_ACTOR, "stf_008")).toThrow(
      UnauthorizedStaffAccessError,
    );

    // Vendor B attempting to access Vendor A's staff record throws UnauthorizedStaffAccessError
    expect(() => vendorStaffRepository.getStaffById(VENDOR_B_ACTOR, "stf_001")).toThrow(
      UnauthorizedStaffAccessError,
    );

    // Vendor A attempting to query filter for Vendor B throws
    expect(() =>
      vendorStaffRepository.listStaff(VENDOR_A_ACTOR, { vendorId: "vnd_azure_01" }),
    ).toThrow(UnauthorizedStaffAccessError);
  });

  it("associates an operational identity from the pre-verified pool with canonical identity fields", () => {
    const created = vendorStaffRepository.associateStaff(VENDOR_A_ACTOR, {
      identityId: "ident_010", // Captain Henri Dubois
      staffType: "PILOT",
      employeeCode: "AJ-2055",
      active: true,
    });

    expect(created.id).toMatch(/^stf_/);
    expect(created.name).toBe("Captain Henri Dubois");
    expect(created.email).toBe("henri.dubois@aviation-crew.internal"); // Canonical verified email
    expect(created.vendorId).toBe("vnd_aerojet_99");
    expect(created.staffType).toBe("PILOT");
    expect(created.employeeCode).toBe("AJ-2055");

    const refreshed = vendorStaffRepository.listStaff(VENDOR_A_ACTOR);
    expect(refreshed.length).toBe(8);
  });

  it("rejects associating an unverified identity ID not in pool", () => {
    expect(() =>
      vendorStaffRepository.associateStaff(VENDOR_A_ACTOR, {
        identityId: "ident_non_existent",
        staffType: "PILOT",
        employeeCode: "AJ-9999",
      }),
    ).toThrow(/Pre-registered verified operational identity.*not found/i);
  });

  it("rejects duplicate identity association to the same vendor organization", () => {
    // ident_001 is already associated with AeroJet as stf_001
    expect(() =>
      vendorStaffRepository.associateStaff(VENDOR_A_ACTOR, {
        identityId: "ident_001",
        staffType: "PILOT",
        employeeCode: "AJ-8888",
      }),
    ).toThrow(/already associated with this vendor organization/i);
  });

  it("rejects duplicate employee codes within the same vendor organization", () => {
    // stf_001 has code AJ-1042
    expect(() =>
      vendorStaffRepository.associateStaff(VENDOR_A_ACTOR, {
        identityId: "ident_010",
        staffType: "PILOT",
        employeeCode: "AJ-1042",
      }),
    ).toThrow(/already in use/i);
  });

  it("validates approved staff types against canonical identity eligibility", () => {
    // ident_010 is eligible for PILOT, CAPTAIN
    expect(() =>
      vendorStaffRepository.associateStaff(VENDOR_A_ACTOR, {
        identityId: "ident_010",
        staffType: "SECURITY", // Not in eligibleRoles
        employeeCode: "AJ-3333",
      }),
    ).toThrow(/not certified or eligible for staff role "SECURITY"/i);
  });

  it("returns defensive snapshot copies preventing internal state mutation", () => {
    const staff = vendorStaffRepository.getStaffById(VENDOR_A_ACTOR, "stf_001");
    expect(staff).toBeDefined();

    if (staff) {
      staff.name = "Hacked Name";
    }

    const fetchedAgain = vendorStaffRepository.getStaffById(VENDOR_A_ACTOR, "stf_001");
    expect(fetchedAgain?.name).toBe("Marcus Vance");
  });

  it("restricts operational identities directory access and denies unauthorized roles", () => {
    const CONCIERGE_ACTOR: AuthorizedActor = {
      id: "usr_concierge",
      name: "Concierge Agent",
      role: "CONCIERGE",
    };

    expect(() => vendorStaffRepository.listEligibleIdentities(CONCIERGE_ACTOR)).toThrow(
      UnauthorizedStaffAccessError,
    );
    expect(() => vendorStaffRepository.getIdentityById(CONCIERGE_ACTOR, "ident_001")).toThrow(
      UnauthorizedStaffAccessError,
    );

    // Admin and Vendor are authorized
    expect(vendorStaffRepository.listEligibleIdentities(ADMIN_ACTOR).length).toBeGreaterThan(0);
    expect(vendorStaffRepository.listEligibleIdentities(VENDOR_A_ACTOR).length).toBeGreaterThan(0);
  });
});
