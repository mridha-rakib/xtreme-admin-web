import {
  UnauthorizedVendorAccessError,
  VendorValidationError,
  vendorRepository,
} from "@/lib/mock/vendors";
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

describe("VendorRepository Scoped Authorization & Domain Model Tests", () => {
  beforeEach(() => {
    vendorRepository.resetDefaults();
  });

  it("requires authenticated actor context for all repository operations", () => {
    expect(() => vendorRepository.listVendors(null)).toThrow(UnauthorizedVendorAccessError);
    expect(() => vendorRepository.getVendorById(null, "vnd_aerojet_99")).toThrow(
      UnauthorizedVendorAccessError,
    );
    expect(() => vendorRepository.getAuthenticatedVendor(null)).toThrow(
      UnauthorizedVendorAccessError,
    );
    expect(() =>
      vendorRepository.createVendor(null, {
        displayName: "Unauthorized Corp",
      }),
    ).toThrow(UnauthorizedVendorAccessError);
  });

  it("allows Admin actors to view all vendor organizations", () => {
    const vendors = vendorRepository.listVendors(ADMIN_ACTOR);
    expect(vendors.length).toBeGreaterThanOrEqual(7);

    const aerojet = vendorRepository.getVendorById(ADMIN_ACTOR, "vnd_aerojet_99");
    expect(aerojet).toBeDefined();
    expect(aerojet?.displayName).toBe("AeroJet Aviation Partners");
  });

  it("strictly scopes Vendor actors to their own organization", () => {
    const vendorList = vendorRepository.listVendors(VENDOR_A_ACTOR);
    expect(vendorList.length).toBe(1);
    expect(vendorList[0].id).toBe("vnd_aerojet_99");

    const ownVendor = vendorRepository.getVendorById(VENDOR_A_ACTOR, "vnd_aerojet_99");
    expect(ownVendor).toBeDefined();
    expect(ownVendor?.id).toBe("vnd_aerojet_99");

    // Vendor A attempting to access Vendor B throws UnauthorizedVendorAccessError
    expect(() => vendorRepository.getVendorById(VENDOR_A_ACTOR, "vnd_azure_01")).toThrow(
      UnauthorizedVendorAccessError,
    );

    // Resolves authenticated vendor directly
    const authVendor = vendorRepository.getAuthenticatedVendor(VENDOR_A_ACTOR);
    expect(authVendor?.id).toBe("vnd_aerojet_99");
  });

  it("prohibits Vendor actors from creating new organizations or changing status", () => {
    expect(() =>
      vendorRepository.createVendor(VENDOR_A_ACTOR, {
        displayName: "New Rogue Vendor",
      }),
    ).toThrow(UnauthorizedVendorAccessError);

    expect(() =>
      vendorRepository.updateVendor(VENDOR_A_ACTOR, "vnd_aerojet_99", {
        status: "ACTIVE",
      }),
    ).toThrow(UnauthorizedVendorAccessError);
  });

  it("validates required display name and length boundaries", () => {
    expect(() =>
      vendorRepository.createVendor(ADMIN_ACTOR, {
        displayName: "",
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor(ADMIN_ACTOR, {
        displayName: "   ",
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor(ADMIN_ACTOR, {
        displayName: "A".repeat(181),
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor(ADMIN_ACTOR, {
        displayName: "Valid Name",
        legalName: "B".repeat(221),
      }),
    ).toThrow(VendorValidationError);
  });

  it("validates contact email and E.164 phone formats", () => {
    expect(() =>
      vendorRepository.createVendor(ADMIN_ACTOR, {
        displayName: "Valid Name",
        contactEmail: "invalid-email-address",
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor(ADMIN_ACTOR, {
        displayName: "Valid Name",
        contactPhone: "555-0190", // Missing country code '+'
      }),
    ).toThrow(VendorValidationError);

    expect(() =>
      vendorRepository.createVendor(ADMIN_ACTOR, {
        displayName: "Valid Name",
        contactPhone: "+01234", // Invalid leading zero in E.164
      }),
    ).toThrow(VendorValidationError);
  });

  it("returns defensive snapshot copies preventing internal state mutation", () => {
    const original = vendorRepository.getVendorById(ADMIN_ACTOR, "vnd_aerojet_99");
    expect(original).toBeDefined();

    // Mutate the returned snapshot
    if (original) {
      original.displayName = "Tampered Name";
    }

    const fetchedAgain = vendorRepository.getVendorById(ADMIN_ACTOR, "vnd_aerojet_99");
    expect(fetchedAgain?.displayName).toBe("AeroJet Aviation Partners");
  });

  it("successfully creates a vendor organization with normalized fields", () => {
    const created = vendorRepository.createVendor(ADMIN_ACTOR, {
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

    const lookup = vendorRepository.getVendorById(ADMIN_ACTOR, created.id);
    expect(lookup).toBeDefined();
    expect(lookup?.displayName).toBe("Alpine Glacier Flights");
  });
});
