import { customerPriceRepository } from "@/lib/mock/customer-prices";
import { evaluateBookingPricing } from "@/lib/mock/pricing-evaluation";
import { StaleRateVersionConflictError, vendorRateRepository } from "@/lib/mock/vendor-rates";
import type { CommandCenterUser } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";

const superAdminUser: CommandCenterUser = {
  id: "usr_admin_1",
  email: "admin@xtreme.local",
  name: "Master Admin",
  role: "SUPER_ADMIN",
};

const vendorUserA: CommandCenterUser = {
  id: "usr_vendor_a",
  email: "vendor_a@atlasjet.com",
  name: "Atlas Jet Manager",
  role: "VENDOR",
  vendorId: "vnd_aerojet_99",
};

const vendorUserB: CommandCenterUser = {
  id: "usr_vendor_b",
  email: "vendor_b@azurevillas.com",
  name: "Azure Villas Manager",
  role: "VENDOR",
  vendorId: "vnd_riviera_02",
};

describe("Pricing Management Repositories & Evaluation", () => {
  beforeEach(() => {
    vendorRateRepository.resetDefaults();
    customerPriceRepository.resetDefaults();
  });

  describe("Vendor Rate Repository", () => {
    it("lists seeded vendor rates for admin", () => {
      const rates = vendorRateRepository.listVendorRates(superAdminUser);
      expect(rates.length).toBeGreaterThanOrEqual(6);
    });

    it("enforces tenant isolation: vendor only sees rates matching their vendorId", () => {
      const ratesA = vendorRateRepository.listVendorRates(vendorUserA);
      expect(ratesA.length).toBeGreaterThanOrEqual(1);
      expect(ratesA.every((r) => r.vendorId === "vnd_aerojet_99")).toBe(true);

      const ratesB = vendorRateRepository.listVendorRates(vendorUserB);
      expect(ratesB.every((r) => r.vendorId === "vnd_riviera_02")).toBe(true);

      // Vendor A cannot access Vendor B rate
      const bRate = ratesB[0];
      if (bRate) {
        expect(() => {
          vendorRateRepository.getVendorRateById(vendorUserA, bRate.id);
        }).toThrow(/Permission denied/);
      }
    });

    it("submits a new vendor rate with PENDING status", () => {
      const submitted = vendorRateRepository.submitVendorRate(vendorUserA, {
        vendorId: "vnd_aerojet_99",
        vendorName: "AeroJet Executive",
        vendorServiceId: "vs_aerojet_charter",
        vendorServiceName: "Charter Flight Operations",
        amount: 5200,
        currency: "USD",
        validFrom: "2026-08-01T00:00:00Z",
        validTo: "2026-12-31T23:59:59Z",
      });

      expect(submitted.id).toBeDefined();
      expect(submitted.status).toBe("PENDING");
      expect(submitted.version).toBe(1);
    });

    it("rejects fractional amounts for zero-decimal currency XOF", () => {
      expect(() => {
        vendorRateRepository.submitVendorRate(superAdminUser, {
          vendorId: "vnd_aerojet_99",
          vendorName: "AeroJet Executive",
          vendorServiceId: "vs_aerojet_charter",
          vendorServiceName: "Charter Flight Operations",
          amount: 2500000.5,
          currency: "XOF",
          validFrom: "2026-08-01T00:00:00Z",
          validTo: "2026-12-31T23:59:59Z",
        });
      }).toThrow(/zero-decimal integer currency/);
    });

    it("rejects invalid date range where validFrom is after validTo", () => {
      expect(() => {
        vendorRateRepository.submitVendorRate(superAdminUser, {
          vendorId: "vnd_aerojet_99",
          vendorName: "AeroJet Executive",
          vendorServiceId: "vs_aerojet_charter",
          vendorServiceName: "Charter Flight Operations",
          amount: 2500000,
          currency: "XOF",
          validFrom: "2026-12-31T00:00:00Z",
          validTo: "2026-01-01T00:00:00Z",
        });
      }).toThrow(/validFrom date must strictly precede validTo date/);
    });

    it("allows admin to approve pending rate and increments version", () => {
      const submitted = vendorRateRepository.submitVendorRate(vendorUserA, {
        vendorId: "vnd_aerojet_99",
        vendorName: "AeroJet Executive",
        vendorServiceId: "vs_aerojet_charter",
        vendorServiceName: "Charter Flight Operations",
        amount: 5000,
        currency: "USD",
        validFrom: "2026-08-01T00:00:00Z",
        validTo: "2026-12-31T23:59:59Z",
      });

      const approved = vendorRateRepository.approveVendorRate(
        superAdminUser,
        submitted.id,
        "Approved for Q3",
        submitted.version,
      );
      expect(approved.status).toBe("APPROVED");
      expect(approved.version).toBe(2);
      expect(approved.decisionBy).toBeDefined();
      expect(approved.decisionAt).toBeDefined();
    });

    it("prohibits vendor from approving or rejecting rates", () => {
      const submitted = vendorRateRepository.submitVendorRate(vendorUserA, {
        vendorId: "vnd_aerojet_99",
        vendorName: "AeroJet Executive",
        vendorServiceId: "vs_aerojet_charter",
        vendorServiceName: "Charter Flight Operations",
        amount: 5000,
        currency: "USD",
        validFrom: "2026-08-01T00:00:00Z",
        validTo: "2026-12-31T23:59:59Z",
      });

      expect(() => {
        vendorRateRepository.approveVendorRate(vendorUserA, submitted.id, submitted.version);
      }).toThrow(/Unauthorized/);

      expect(() => {
        vendorRateRepository.rejectVendorRate(
          vendorUserA,
          submitted.id,
          "No reason",
          submitted.version,
        );
      }).toThrow(/Unauthorized/);
    });

    it("enforces optimistic concurrency control with StaleRateVersionConflictError", () => {
      const submitted = vendorRateRepository.submitVendorRate(vendorUserA, {
        vendorId: "vnd_aerojet_99",
        vendorName: "AeroJet Executive",
        vendorServiceId: "vs_aerojet_charter",
        vendorServiceName: "Charter Flight Operations",
        amount: 5000,
        currency: "USD",
        validFrom: "2026-08-01T00:00:00Z",
        validTo: "2026-12-31T23:59:59Z",
      });

      // Pass wrong version (e.g. 99 instead of 1)
      expect(() => {
        vendorRateRepository.approveVendorRate(superAdminUser, submitted.id, 99);
      }).toThrow(StaleRateVersionConflictError);
    });
  });

  describe("Customer Price Repository", () => {
    it("lists customer price configurations for admin", () => {
      const prices = customerPriceRepository.listCustomerPrices(superAdminUser);
      expect(prices.length).toBeGreaterThanOrEqual(4);
    });

    it("strictly blocks vendor users from listing customer price configurations", () => {
      expect(() => {
        customerPriceRepository.listCustomerPrices(vendorUserA);
      }).toThrow(/Unauthorized/);
    });

    it("creates a customer price configuration and enforces integer XOF amount", () => {
      const created = customerPriceRepository.createCustomerPrice(superAdminUser, {
        serviceId: "srv_jet_intl",
        serviceName: "Transatlantic Jet Service",
        serviceCategory: "aviation",
        priceMode: "FIXED",
        xofAmount: 4200000,
        validFrom: "2026-07-01T00:00:00Z",
        validTo: "2026-12-31T23:59:59Z",
        active: true,
      });

      expect(created.id).toBeDefined();
      expect(created.xofAmount).toBe(4200000);

      // Rejects non-integer XOF amount
      expect(() => {
        customerPriceRepository.createCustomerPrice(superAdminUser, {
          serviceId: "srv_jet_intl_2",
          serviceName: "Transatlantic Jet Service 2",
          serviceCategory: "aviation",
          priceMode: "FIXED",
          xofAmount: 4200000.75,
          validFrom: "2026-07-01T00:00:00Z",
          validTo: "2026-12-31T23:59:59Z",
          active: true,
        });
      }).toThrow(/zero-decimal integer currency/);
    });

    it("toggles customer price configuration active state", () => {
      const prices = customerPriceRepository.listCustomerPrices(superAdminUser);
      const target = prices[0];
      const toggled = customerPriceRepository.toggleCustomerPriceActive(
        superAdminUser,
        target.id,
        !target.active,
      );
      expect(toggled.active).toBe(!target.active);
    });
  });

  describe("Pricing Evaluation Engine", () => {
    it("evaluates active customer price for an aviation booking", () => {
      const result = evaluateBookingPricing(superAdminUser, {
        serviceCategory: "aviation",
        bookingDateIso: "2026-03-15T12:00:00Z",
        vendorId: "vnd_aerojet_99",
      });

      expect(result.customerSellingPriceXof).toBeGreaterThan(0);
      expect(result.appliedCustomerPriceId).toBeDefined();
      expect(result.vendorRateApplied).toBe(true);
      expect(result.activeVendorRate?.status).toBe("APPROVED");
    });

    it("vendor cannot see admin margin details during pricing evaluation", () => {
      const result = evaluateBookingPricing(vendorUserA, {
        serviceCategory: "aviation",
        bookingDateIso: "2026-03-15T12:00:00Z",
        vendorId: "vnd_aerojet_99",
      });

      // Vendor cost is visible to own vendor, but internal margin is hidden
      expect(result.vendorCostAmount).toBeDefined();
      expect(result.estimatedMarginXof).toBeUndefined();
    });
  });
});
