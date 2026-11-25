import type { AuthorizedActor } from "@/types";
import type { CustomerPriceConfig, VendorRate } from "@/types/pricing";
import { customerPriceRepository } from "./customer-prices";
import { vendorRateRepository } from "./vendor-rates";

export interface PricingEvaluationResult {
  resolvable: boolean;
  ambiguous?: boolean;
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
   * 5. Ambiguity detection: If multiple active configurations match at the same specificity tier,
   *    fails closed with ambiguous=true and resolvable=false (no arbitrary first-match selection).
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
        const validPrices = prices.filter((p) => {
          if (!p.active) return false;
          const fromMs = Date.parse(p.validFrom);
          const toMs = Date.parse(p.validTo);
          return targetDateMs >= fromMs && targetDateMs <= toMs;
        });

        // Deterministic specificity precedence with strict ambiguity detection:
        // Tier 1: Exact asset match
        if (assetId) {
          const matches = validPrices.filter((p) => p.assetId === assetId);
          if (matches.length > 1) {
            return {
              resolvable: false,
              ambiguous: true,
              reason: `Ambiguous customer pricing: ${matches.length} active matching configurations detected for asset "${assetId}".`,
            };
          }
          if (matches.length === 1) {
            customerPrice = matches[0];
          }
        }

        // Tier 2: Vendor service match
        if (!customerPrice && vendorServiceId) {
          const matches = validPrices.filter(
            (p) => p.vendorServiceId === vendorServiceId && !p.assetId,
          );
          if (matches.length > 1) {
            return {
              resolvable: false,
              ambiguous: true,
              reason: `Ambiguous customer pricing: ${matches.length} active matching configurations detected for vendor service "${vendorServiceId}".`,
            };
          }
          if (matches.length === 1) {
            customerPrice = matches[0];
          }
        }

        // Tier 3: Generic service match
        if (!customerPrice && serviceId) {
          const matches = validPrices.filter(
            (p) => p.serviceId === serviceId && !p.assetId && !p.vendorServiceId,
          );
          if (matches.length > 1) {
            return {
              resolvable: false,
              ambiguous: true,
              reason: `Ambiguous customer pricing: ${matches.length} active matching configurations detected for service "${serviceId}".`,
            };
          }
          if (matches.length === 1) {
            customerPrice = matches[0];
          }
        }
      } catch {
        // Actor unauthorized for customer prices
      }
    }

    // 2. Resolve Approved Vendor Rate
    let vendorRate: VendorRate | undefined;
    try {
      const rates = vendorRateRepository.listVendorRates(actor, { status: "APPROVED" });
      const validRates = rates.filter((r) => {
        if (r.status !== "APPROVED") return false;
        const fromMs = Date.parse(r.validFrom);
        const toMs = Date.parse(r.validTo);
        return targetDateMs >= fromMs && targetDateMs <= toMs;
      });

      // Deterministic specificity precedence with strict ambiguity detection:
      // Tier 1: Exact asset match
      if (assetId) {
        const matches = validRates.filter((r) => r.assetId === assetId);
        if (matches.length > 1) {
          return {
            resolvable: false,
            ambiguous: true,
            reason: `Ambiguous vendor rate: ${matches.length} approved matching rates detected for asset "${assetId}".`,
          };
        }
        if (matches.length === 1) {
          vendorRate = matches[0];
        }
      }

      // Tier 2: Vendor service match
      if (!vendorRate && vendorServiceId) {
        const matches = validRates.filter(
          (r) => r.vendorServiceId === vendorServiceId && !r.assetId,
        );
        if (matches.length > 1) {
          return {
            resolvable: false,
            ambiguous: true,
            reason: `Ambiguous vendor rate: ${matches.length} approved matching rates detected for vendor service "${vendorServiceId}".`,
          };
        }
        if (matches.length === 1) {
          vendorRate = matches[0];
        }
      }
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
  if (!isVendor && customerPrice && vendorRate && vendorRate.currency === "XOF") {
    estimatedMarginXof = customerPrice.xofAmount - vendorRate.amount;
  }

  return {
    customerSellingPriceXof: !isVendor ? customerPrice?.xofAmount : undefined,
    appliedCustomerPriceId: !isVendor ? customerPrice?.id : undefined,
    vendorRateApplied: !!vendorRate,
    activeVendorRate: vendorRate,
    vendorCostAmount: vendorRate?.amount,
    vendorCostCurrency: vendorRate?.currency,
    estimatedMarginXof,
  };
}
