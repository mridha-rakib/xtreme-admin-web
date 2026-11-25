import { catalogRepository } from "@/lib/mock/catalog";
import {
  FinancialReportingService,
  UnauthorizedFinanceReportAccessError,
  financialReportingService,
} from "@/lib/mock/financial-reporting";
import {
  FxRateValidationError,
  UnauthorizedFxAccessError,
  fxRateRepository,
} from "@/lib/mock/fx-rates";
import {
  StalePayableVersionConflictError,
  UnauthorizedPayableAccessError,
  VendorPayableValidationError,
  vendorPayableRepository,
} from "@/lib/mock/vendor-payables";
import type { CommandCenterUser } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";

const superAdminUser: CommandCenterUser = {
  id: "usr_admin_1",
  email: "admin@xtreme.local",
  name: "Master Admin",
  role: "SUPER_ADMIN",
};

const adminUser: CommandCenterUser = {
  id: "usr_admin_2",
  email: "ops@xtreme.local",
  name: "Operations Admin",
  role: "ADMIN",
};

const vendorUserA: CommandCenterUser = {
  id: "usr_vendor_a",
  email: "vendor_a@monacochauffeur.com",
  name: "Monaco Fleet Manager",
  role: "VENDOR",
  vendorId: "vnd_005",
};

const vendorUserB: CommandCenterUser = {
  id: "usr_vendor_b",
  email: "vendor_b@azuremarine.com",
  name: "Azure Marine Manager",
  role: "VENDOR",
  vendorId: "vnd_azure_01",
};

describe("Batch 9 Repositories & Domain Services", () => {
  beforeEach(() => {
    vendorPayableRepository.resetDefaults();
    fxRateRepository.resetDefaults();
    catalogRepository.resetDefaults();
  });

  describe("Vendor Payable Repository", () => {
    it("lists seeded vendor payables for administrators", () => {
      const payables = vendorPayableRepository.listPayables(superAdminUser);
      expect(payables.length).toBeGreaterThanOrEqual(5);
    });

    it("enforces tenant isolation: vendor only sees payables for own organization", () => {
      const vendorAPayables = vendorPayableRepository.listPayables(vendorUserA);
      expect(vendorAPayables.length).toBeGreaterThan(0);
      expect(vendorAPayables.every((p) => p.vendorId === "vnd_005")).toBe(true);

      const vendorBPayables = vendorPayableRepository.listPayables(vendorUserB);
      expect(vendorBPayables.length).toBeGreaterThan(0);
      expect(vendorBPayables.every((p) => p.vendorId === "vnd_azure_01")).toBe(true);

      // Cross-vendor detail lookup is blocked
      const bPayable = vendorBPayables[0];
      expect(() => {
        vendorPayableRepository.getPayableById(vendorUserA, bPayable.id);
      }).toThrow(UnauthorizedPayableAccessError);
    });

    it("allows administrators to update payout tracking and increments version", () => {
      const target = vendorPayableRepository.getPayableById(superAdminUser, "pay_016");
      expect(target).toBeDefined();
      if (!target) return;

      const updated = vendorPayableRepository.updateVendorPayable(superAdminUser, {
        payableId: target.id,
        amountPaid: 1000,
        status: "PROCESSING",
        payoutReference: "WIRE-TEST-2026",
        notes: "Partial milestone disbursement approved",
        expectedVersion: target.version,
      });

      expect(updated.version).toBe(target.version + 1);
      expect(updated.amountPaid).toBe(1000);
      expect(updated.status).toBe("PROCESSING");
      expect(updated.payoutReference).toBe("WIRE-TEST-2026");
    });

    it("rejects amount paid exceeding total amount due", () => {
      const target = vendorPayableRepository.getPayableById(superAdminUser, "pay_016");
      expect(target).toBeDefined();
      if (!target) return;

      expect(() => {
        vendorPayableRepository.updateVendorPayable(superAdminUser, {
          payableId: target.id,
          amountPaid: target.amountDue + 500, // Exceeds due
          status: "PAID",
          expectedVersion: target.version,
        });
      }).toThrow(VendorPayableValidationError);
    });

    it("prohibits vendor persona from updating payable records", () => {
      expect(() => {
        vendorPayableRepository.updateVendorPayable(vendorUserA, {
          payableId: "pay_018",
          status: "PAID",
        });
      }).toThrow(UnauthorizedPayableAccessError);
    });

    it("enforces optimistic concurrency control with StalePayableVersionConflictError", () => {
      const target = vendorPayableRepository.getPayableById(superAdminUser, "pay_016");
      expect(target).toBeDefined();
      if (!target) return;

      expect(() => {
        vendorPayableRepository.updateVendorPayable(superAdminUser, {
          payableId: target.id,
          amountPaid: 500,
          status: "PROCESSING",
          expectedVersion: 999, // Stale version
        });
      }).toThrow(StalePayableVersionConflictError);
    });
  });

  describe("FX Rate Repository & Treasury Management", () => {
    it("lists seeded FX pairs for administrators", () => {
      const rates = fxRateRepository.listRates(superAdminUser);
      expect(rates.length).toBe(2);
      expect(rates.some((r) => r.pair === "USD/XOF")).toBe(true);
      expect(rates.some((r) => r.pair === "EUR/XOF")).toBe(true);
    });

    it("prohibits vendor persona from accessing treasury rates", () => {
      expect(() => {
        fxRateRepository.listRates(vendorUserA);
      }).toThrow(UnauthorizedFxAccessError);
    });

    it("allows Super Admin to set manual override with operational justification", () => {
      const updated = fxRateRepository.setManualOverride(superAdminUser, {
        pair: "USD/XOF",
        rate: 618.5,
        reason: "Market liquidity spread compensation",
      });

      expect(updated.source).toBe("MANUAL");
      expect(updated.rate).toBe(618.5);
      expect(updated.overrideReason).toBe("Market liquidity spread compensation");
      expect(updated.version).toBe(2);

      // Audit log records entry
      const audit = fxRateRepository.getAuditLog(superAdminUser);
      expect(audit[0].pair).toBe("USD/XOF");
      expect(audit[0].rate).toBe(618.5);
      expect(audit[0].source).toBe("MANUAL");
    });

    it("prohibits standard Admin from setting manual overrides", () => {
      expect(() => {
        fxRateRepository.setManualOverride(adminUser, {
          pair: "USD/XOF",
          rate: 620.0,
          reason: "Unauthorized attempt",
        });
      }).toThrow(UnauthorizedFxAccessError);
    });

    it("rejects non-positive or missing reason overrides", () => {
      expect(() => {
        fxRateRepository.setManualOverride(superAdminUser, {
          pair: "USD/XOF",
          rate: -10,
          reason: "Negative test",
        });
      }).toThrow(FxRateValidationError);

      expect(() => {
        fxRateRepository.setManualOverride(superAdminUser, {
          pair: "USD/XOF",
          rate: 615,
          reason: "   ", // Blank reason
        });
      }).toThrow(FxRateValidationError);
    });

    it("allows Super Admin to clear manual override and restore automated fixing", () => {
      // First set override
      fxRateRepository.setManualOverride(superAdminUser, {
        pair: "USD/XOF",
        rate: 625,
        reason: "Temporary spike",
      });

      // Then clear override
      const restored = fxRateRepository.clearManualOverride(superAdminUser, "USD/XOF");
      expect(restored.source).toBe("AUTO");
      expect(restored.rate).toBe(restored.lastAutoRate);
      expect(restored.overrideRate).toBeUndefined();
    });

    it("converts amounts between currencies deterministically", () => {
      const xofFromUsd = fxRateRepository.convert(100, "USD", "XOF");
      expect(xofFromUsd).toBe(61250); // 100 * 612.5

      const xofFromEur = fxRateRepository.convert(100, "EUR", "XOF");
      expect(xofFromEur).toBe(65596); // 100 * 655.957 rounded
    });
  });

  describe("Financial Reporting Service", () => {
    it("computes all 7 canonical financial summary metrics for administrators", () => {
      const summary = financialReportingService.getFinancialSummaryMetrics(superAdminUser);

      // Verify all 7 metric properties exist and are finite numbers
      expect(summary.customerRevenueXof).toBeGreaterThan(0);
      expect(summary.vendorCostXof).toBeGreaterThan(0);
      expect(summary.grossMarginXof).toBeDefined();
      expect(summary.grossMarginPercentage).toBeDefined();
      expect(summary.paymentsReceivedXof).toBeGreaterThan(0);
      expect(summary.refundsIssuedXof).toBeGreaterThanOrEqual(0);
      expect(summary.outstandingCustomerBalanceXof).toBeGreaterThanOrEqual(0);
      expect(summary.vendorAmountDueXof).toBeGreaterThanOrEqual(0);

      // Gross margin equals Revenue minus Cost
      expect(summary.grossMarginXof).toBe(summary.customerRevenueXof - summary.vendorCostXof);
    });

    it("strictly blocks vendor persona from accessing financial summary metrics", () => {
      expect(() => {
        financialReportingService.getFinancialSummaryMetrics(vendorUserA);
      }).toThrow(UnauthorizedFinanceReportAccessError);
    });
  });

  describe("Catalog Repository", () => {
    it("lists seeded catalog categories with hierarchy and localization", () => {
      const categories = catalogRepository.listCategories();
      expect(categories.length).toBeGreaterThanOrEqual(8);

      const aviation = categories.find((c) => c.slug === "aviation");
      expect(aviation).toBeDefined();
      expect(aviation?.localizedNames.en).toBe("Aviation & Air Charter");
      expect(aviation?.localizedNames.fr).toBe("Aviation & Affrètement Aérien");
      expect(aviation?.parentId).toBeUndefined(); // Root
    });

    it("filters categories by parent category", () => {
      const subcategories = catalogRepository.listCategories({
        parentId: "cat_aviation",
      });
      expect(subcategories.length).toBeGreaterThanOrEqual(2);
      expect(subcategories.every((c) => c.parentId === "cat_aviation")).toBe(true);
    });

    it("toggles category active state", () => {
      const target = catalogRepository.getCategoryById("cat_expeditions");
      expect(target).toBeDefined();
      if (!target) return;

      const updated = catalogRepository.toggleCategoryActive(
        superAdminUser,
        target.id,
        !target.active,
      );
      expect(updated.active).toBe(!target.active);
    });
  });
});
