import { VendorValidationError, vendorRepository } from "@/lib/mock/vendors";
import { beforeEach, describe, expect, it } from "vitest";

describe("VendorRepository Unit & Domain Model Tests", () => {
  beforeEach(() => {
    vendorRepository.resetDefaults();
  });

  it("lists seeded vendor organizations matching authoritative Figma references", () => {
    const vendors = vendorRepository.listVendors();
    expect(vendors.length).toBeGreaterThanOrEqual(7);

    const aerojet = vendorRepository.getVendorById("vnd_aerojet_99");
    expect(aerojet).toBeDefined();
    expect(aerojet?.displayName).toBe("AeroJet Aviation Partners");
    expect(aerojet?.legalName).toBe("AeroJet Aviation Worldwide Inc.");
    expect(aerojet?.status).toBe("ACTIVE");
    expect(aerojet?.contactEmail).toBe("ops@aerojet-partners.internal");
    expect(aerojet?.contactPhone).toBe("+12125550190");
  });

  it("filters vendor organizations by status and search query", () => {
    const activeVendors = vendorRepository.listVendors({ status: "ACTIVE" });
    expect(activeVendors.every((v) => v.status === "ACTIVE")).toBe(true);

    const maintenanceVendors = vendorRepository.listVendors({ status: "MAINTENANCE" });
    expect(maintenanceVendors.every((v) => v.status === "MAINTENANCE")).toBe(true);

    const searchRes = vendorRepository.listVendors({ search: "Marine" });
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].displayName).toBe("Côte d'Azur Marine");
  });

  it("validates required display name and length boundaries", () => {
    expect(() =>
      vendorRepository.createVendor({
        displayName: "",
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor({
        displayName: "   ",
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor({
        displayName: "A".repeat(181),
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor({
        displayName: "Valid Name",
        legalName: "B".repeat(221),
      }),
    ).toThrow(VendorValidationError);
  });

  it("validates contact email and E.164 phone formats", () => {
    expect(() =>
      vendorRepository.createVendor({
        displayName: "Valid Name",
        contactEmail: "invalid-email-address",
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor({
        displayName: "Valid Name",
        contactPhone: "555-0190", // Missing country code '+'
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor({
        displayName: "Valid Name",
        contactPhone: "+01234", // Invalid leading zero in E.164
      }),
    ).toThrow(VendorValidationError);
  });

  it("successfully creates a vendor organization with normalized fields", () => {
    const created = vendorRepository.createVendor({
      displayName: "  Alpine Glacier Flights  ",
      legalName: "Glacier Express Aviation AG",
      status: "ACTIVE",
      contactEmail: "info@alpineglacier.internal",
      contactPhone: "+41227100100",
    });

    expect(created.id).toMatch(/^vnd_/);
    expect(created.displayName).toBe("Alpine Glacier Flights");
    expect(created.legalName).toBe("Glacier Express Aviation AG");
    expect(created.status).toBe("ACTIVE");
    expect(created.contactEmail).toBe("info@alpineglacier.internal");
    expect(created.contactPhone).toBe("+41227100100");

    const lookup = vendorRepository.getVendorById(created.id);
    expect(lookup).toBeDefined();
    expect(lookup?.displayName).toBe("Alpine Glacier Flights");
  });

  it("updates vendor organization fields and throws for missing records", () => {
    const updated = vendorRepository.updateVendor("vnd_aerojet_99", {
      status: "MAINTENANCE",
      contactPhone: "+12125550999",
    });

    expect(updated.status).toBe("MAINTENANCE");
    expect(updated.contactPhone).toBe("+12125550999");
    expect(updated.displayName).toBe("AeroJet Aviation Partners");

    expect(() =>
      vendorRepository.updateVendor("non_existent_id", {
        displayName: "New Name",
      }),
    ).toThrow(VendorValidationError);
  });
});
