import type { AuthorizedActor } from "@/types";
import type { CustomerPriceConfig, VendorRate } from "@/types/pricing";
import { customerPriceRepository } from "./customer-prices";
import { vendorRateRepository } from "./vendor-rates";

export interface PricingEvaluationResult {
  resolvable: boolean;
  reason?: string;
  vendorRate?: VendorRate;
  customerPrice?: CustomerPriceConfig;
  sellingAmountXof?: number;
  costAmount?: number;
  costCurrency?: string;
  priceMode?: string;
}

export class PricingEvaluationService {
  /**
   * Resolves the authoritative customer selling price and active approved vendor rate
   * for a service at an effective booking date.
   *
   * Enforces:
   * 1. Only APPROVED vendor rates are eligible (PENDING and REJECTED rates are rejected).
   * 2. Vendor rate validity interval (validFrom <= effectiveDate <= validTo).
   * 3. Only ACTIVE customer price configurations are eligible.
   * 4. Customer price validity interval.
   * 5. If no applicable approved price is found, fails closed with resolvable=false (no fabricated fallback prices).
   * 6. Multi-tenant boundary: Vendors cannot see customer selling prices or margins.
   */
  public resolveApplicablePricing(
    actor: AuthorizedActor | null | undefined,
    serviceId: string,
    vendorServiceId?: string,
    assetId?: string,
    effectiveDateIso?: string,
  ): PricingEvaluationResult {
    const targetDateMs = effectiveDateIso ? Date.parse(effectiveDateIso) : Date.now();

    // 1. Resolve Customer Selling Price Configuration (XTREME actors only)
    let customerPrice: CustomerPriceConfig | undefined;
    if (actor?.role !== "VENDOR") {
      try {
        const prices = customerPriceRepository.listCustomerPrices(actor, { active: true });
        // Specific asset match has highest priority, then vendorService match, then serviceId
        customerPrice = prices.find((p) => {
          if (!p.active) return false;
          const fromMs = Date.parse(p.validFrom);
          const toMs = Date.parse(p.validTo);
          if (targetDateMs < fromMs || targetDateMs > toMs) return false;

          if (assetId && p.assetId === assetId) return true;
          if (vendorServiceId && p.vendorServiceId === vendorServiceId) return true;
          if (p.serviceId === serviceId) return true;
          return false;
        });
      } catch {
        // Actor unauthorized for customer prices
      }
    }

    // 2. Resolve Approved Vendor Rate
    let vendorRate: VendorRate | undefined;
    try {
      const rates = vendorRateRepository.listVendorRates(actor, { status: "APPROVED" });
      vendorRate = rates.find((r) => {
        if (r.status !== "APPROVED") return false;
        const fromMs = Date.parse(r.validFrom);
        const toMs = Date.parse(r.validTo);
        if (targetDateMs < fromMs || targetDateMs > toMs) return false;

        if (assetId && r.assetId === assetId) return true;
        if (vendorServiceId && r.vendorServiceId === vendorServiceId) return true;
        return false;
      });
    } catch {
      // Actor unauthorized for vendor rates
    }

    if (!customerPrice && !vendorRate) {
      return {
        resolvable: false,
        reason: `No approved active pricing configuration found for service "${serviceId}" on ${new Date(targetDateMs).toISOString().split("T")[0]}.`,
      };
    }

    return {
      resolvable: true,
      vendorRate,
      customerPrice,
      sellingAmountXof: customerPrice?.xofAmount,
      costAmount: vendorRate?.amount,
      costCurrency: vendorRate?.currency,
      priceMode: customerPrice?.priceMode,
    };
  }
}

export const pricingEvaluationService = new PricingEvaluationService();

export interface BookingPricingResult {
  customerSellingPriceXof?: number;
  appliedCustomerPriceId?: string;
  vendorRateApplied: boolean;
  activeVendorRate?: VendorRate;
  vendorCostAmount?: number;
  vendorCostCurrency?: string;
  estimatedMarginXof?: number;
}

export function evaluateBookingPricing(
  actor: AuthorizedActor | null | undefined,
  params: {
    serviceCategory?: string;
    serviceId?: string;
    bookingDateIso?: string;
    vendorId?: string;
    vendorServiceId?: string;
    assetId?: string;
  },
): BookingPricingResult {
  const targetDateMs = params.bookingDateIso ? Date.parse(params.bookingDateIso) : Date.now();

  // 1. Resolve Customer Price Config (Admins only)
  let customerPrice: CustomerPriceConfig | undefined;
  if (actor?.role !== "VENDOR") {
    try {
      const prices = customerPriceRepository.listCustomerPrices(actor, { active: true });
      customerPrice = prices.find((p) => {
        if (!p.active) return false;
        if (params.serviceCategory && p.serviceCategory !== params.serviceCategory) return false;
        if (params.serviceId && p.serviceId !== params.serviceId) return false;
        const fromMs = Date.parse(p.validFrom);
        const toMs = Date.parse(p.validTo);
        if (targetDateMs < fromMs || targetDateMs > toMs) return false;
        return true;
      });
    } catch {
      // Actor unauthorized
    }
  }

  // 2. Resolve Approved Vendor Rate
  let vendorRate: VendorRate | undefined;
  try {
    const rates = vendorRateRepository.listVendorRates(actor, { status: "APPROVED" });
    vendorRate = rates.find((r) => {
      if (r.status !== "APPROVED") return false;
      if (params.vendorId && r.vendorId !== params.vendorId) return false;
      if (params.vendorServiceId && r.vendorServiceId !== params.vendorServiceId) return false;
      if (params.assetId && r.assetId !== params.assetId) return false;
      const fromMs = Date.parse(r.validFrom);
      const toMs = Date.parse(r.validTo);
      if (targetDateMs < fromMs || targetDateMs > toMs) return false;
      return true;
    });
  } catch {
    // Actor unauthorized
  }

  const isVendor = actor?.role === "VENDOR";

  // Calculate estimated margin only if admin and currencies permit
  let estimatedMarginXof: number | undefined;
  if (!isVendor && customerPrice?.xofAmount && vendorRate) {
    if (vendorRate.currency === "XOF") {
      estimatedMarginXof = customerPrice.xofAmount - vendorRate.amount;
    } else if (vendorRate.currency === "USD") {
      // Estimated 1 USD ~ 600 XOF conversion for internal margin reference
      const approximateVendorXof = vendorRate.amount * 600;
      estimatedMarginXof = customerPrice.xofAmount - approximateVendorXof;
    }
  }

  return {
    customerSellingPriceXof: isVendor ? undefined : customerPrice?.xofAmount,
    appliedCustomerPriceId: isVendor ? undefined : customerPrice?.id,
    vendorRateApplied: !!vendorRate,
    activeVendorRate: vendorRate,
    vendorCostAmount: vendorRate?.amount,
    vendorCostCurrency: vendorRate?.currency,
    estimatedMarginXof,
  };
}
