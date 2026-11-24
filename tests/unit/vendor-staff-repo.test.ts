import { VendorStaffValidationError, vendorStaffRepository } from "@/lib/mock/vendor-staff";
import { beforeEach, describe, expect, it } from "vitest";

describe("VendorStaffRepository Unit & Multi-Tenant Tests", () => {
  beforeEach(() => {
    vendorStaffRepository.resetDefaults();
  });

  it("lists staff strictly scoped to the requested vendor organization", () => {
    const aerojetStaff = vendorStaffRepository.listStaffByVendor("vnd_aerojet_99");
    expect(aerojetStaff.length).toBe(7);
    expect(aerojetStaff.every((s) => s.vendorId === "vnd_aerojet_99")).toBe(true);

    const azureStaff = vendorStaffRepository.listStaffByVendor("vnd_azure_01");
    expect(azureStaff.length).toBe(2);
    expect(azureStaff.every((s) => s.vendorId === "vnd_azure_01")).toBe(true);
  });

  it("enforces strict multi-tenant isolation with zero cross-vendor leakage", () => {
    const aerojetStaff = vendorStaffRepository.listStaffByVendor("vnd_aerojet_99");
    const aerojetNames = aerojetStaff.map((s) => s.name);

    expect(aerojetNames).toContain("Marcus Vance");
    expect(aerojetNames).not.toContain("Claire Delacroix"); // Belongs to azure_01
    expect(aerojetNames).not.toContain("Jean-Luc Picard"); // Belongs to azure_01

    const emptyVendorStaff = vendorStaffRepository.listStaffByVendor("vnd_non_existent");
    expect(emptyVendorStaff.length).toBe(0);
  });

  it("filters vendor staff by active status and query", () => {
    const activeStaff = vendorStaffRepository.listStaffByVendor("vnd_aerojet_99", {
      active: true,
    });
    expect(activeStaff.every((s) => s.active)).toBe(true);

    const pilotStaff = vendorStaffRepository.listStaffByVendor("vnd_aerojet_99", {
      search: "PILOT",
    });
    expect(pilotStaff.length).toBe(2);
    expect(pilotStaff.map((s) => s.name)).toEqual(
      expect.arrayContaining(["Marcus Vance", "Alexander Wright"]),
    );
  });

  it("validates required fields on staff creation", () => {
    expect(() =>
      vendorStaffRepository.createStaff({
        vendorId: "",
        name: "John Doe",
        email: "john@demo.com",
        staffType: "PILOT",
        employeeCode: "EMP-999",
      }),
    ).toThrow(VendorStaffValidationError);

    expect(() =>
      vendorStaffRepository.createStaff({
        vendorId: "vnd_aerojet_99",
        name: "   ",
        email: "john@demo.com",
        staffType: "PILOT",
        employeeCode: "EMP-999",
      }),
    ).toThrow(VendorStaffValidationError);

    expect(() =>
      vendorStaffRepository.createStaff({
        vendorId: "vnd_aerojet_99",
        name: "John Doe",
        email: "john@demo.com",
        staffType: "PILOT",
        employeeCode: "",
      }),
    ).toThrow(VendorStaffValidationError);
  });

  it("successfully creates a staff record and appends to the correct organization", () => {
    const created = vendorStaffRepository.createStaff({
      vendorId: "vnd_azure_01",
      name: "Captain Henri Dubois",
      email: "henri@cotedazur.internal",
      staffType: "PILOT",
      employeeCode: "CY-2003",
      active: true,
    });

    expect(created.id).toMatch(/^stf_/);
    expect(created.name).toBe("Captain Henri Dubois");
    expect(created.vendorId).toBe("vnd_azure_01");

    const azureStaff = vendorStaffRepository.listStaffByVendor("vnd_azure_01");
    expect(azureStaff.length).toBe(3);
    expect(azureStaff.map((s) => s.id)).toContain(created.id);

    // Verify it didn't leak into aerojet
    const aerojetStaff = vendorStaffRepository.listStaffByVendor("vnd_aerojet_99");
    expect(aerojetStaff.length).toBe(7);
    expect(aerojetStaff.map((s) => s.id)).not.toContain(created.id);
  });
});
