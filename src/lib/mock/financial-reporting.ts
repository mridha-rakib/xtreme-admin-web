import { bookingRepository } from "@/lib/mock/bookings";
import { fxRateRepository } from "@/lib/mock/fx-rates";
import { paymentRepository } from "@/lib/mock/payments";
import { vendorPayableRepository } from "@/lib/mock/vendor-payables";
import {
  type AuthorizedActor,
  type FinancialDateRange,
  type FinancialSummaryMetrics,
  hasCommandCenterPermission,
} from "@/types";

export class UnauthorizedFinanceReportAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedFinanceReportAccessError";
  }
}

export const RECOGNIZED_REVENUE_STATUSES = new Set(["CONFIRMED", "IN_PROGRESS", "COMPLETED"]);

export function getDateRangeBounds(
  range: FinancialDateRange = "ALL_TIME",
  referenceDate: Date = new Date(),
): { startMs: number; endMs: number } {
  const ref = referenceDate.getTime();
  switch (range) {
    case "THIS_MONTH": {
      const start = new Date(
        Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1, 0, 0, 0, 0),
      ).getTime();
      const end = new Date(
        Date.UTC(
          referenceDate.getUTCFullYear(),
          referenceDate.getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      ).getTime();
      return { startMs: start, endMs: end };
    }
    case "LAST_30_DAYS": {
      const end = ref;
      const start = ref - 30 * 24 * 60 * 60 * 1000;
      return { startMs: start, endMs: end };
    }
    case "THIS_QUARTER": {
      const quarterStartMonth = Math.floor(referenceDate.getUTCMonth() / 3) * 3;
      const start = new Date(
        Date.UTC(referenceDate.getUTCFullYear(), quarterStartMonth, 1, 0, 0, 0, 0),
      ).getTime();
      const end = new Date(
        Date.UTC(referenceDate.getUTCFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999),
      ).getTime();
      return { startMs: start, endMs: end };
    }
    case "YTD": {
      const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1, 0, 0, 0, 0)).getTime();
      const end = ref;
      return { startMs: start, endMs: end };
    }
    default:
      return { startMs: 0, endMs: Number.MAX_SAFE_INTEGER };
  }
}

export class FinancialReportingService {
  /**
   * Computes the 7 canonical financial summary metrics derived from authoritative
   * bookings, payments, and vendor payables ledgers:
   * 1. Customer Revenue (in XOF)
   * 2. Vendor Cost (in XOF)
   * 3. XTREME Gross Margin (in XOF) + Margin %
   * 4. Payments Received (in XOF)
   * 5. Refunds Issued (in XOF)
   * 6. Outstanding Customer Balance (in XOF)
   * 7. Vendor Amount Due (in XOF)
   *
   * Enforces:
   * - Strict role authorization (Admins only; VENDOR and CUSTOMER personas blocked).
   * - Revenue recognition: only CONFIRMED, IN_PROGRESS, COMPLETED bookings.
   * - Date range boundaries across all ledger entries.
   * - Historical FX snapshot conversion using immutable transaction timestamps.
   * - Booking-level receivables calculation to prevent cross-booking distortion.
   */
  public getFinancialSummaryMetrics(
    actor: AuthorizedActor | null | undefined,
    dateRange: FinancialDateRange = "ALL_TIME",
  ): FinancialSummaryMetrics {
    if (!actor || !actor.role) {
      throw new UnauthorizedFinanceReportAccessError(
        "Authentication required: Actor context missing.",
      );
    }

    if (!hasCommandCenterPermission(actor.role, "view:finance") && actor.role !== "SUPER_ADMIN") {
      throw new UnauthorizedFinanceReportAccessError(
        `Role "${actor.role}" is not authorized to view financial reporting metrics. Access is restricted to Command Center administrators.`,
      );
    }

    const { startMs, endMs } = getDateRangeBounds(dateRange);
    let incompleteData = false;

    // Fetch all bookings without artificial pagination cutoff
    const allBookings = bookingRepository.listBookings({ pageSize: 10000 }).items;
    const allPayments = paymentRepository.listPayments();
    const allPayables = vendorPayableRepository.listPayables(actor);

    // 1. Customer Revenue: recognized bookings in reporting interval
    let customerRevenueXof = 0;
    const recognizedBookingsInPeriod: typeof allBookings = [];

    for (const b of allBookings) {
      const bDateMs = Date.parse(b.createdAt);
      if (bDateMs < startMs || bDateMs > endMs) continue;

      if (RECOGNIZED_REVENUE_STATUSES.has(b.lifecycleStatus)) {
        try {
          const res = fxRateRepository.convertHistorical(
            b.priceAmount,
            b.currency,
            "XOF",
            b.createdAt,
          );
          customerRevenueXof += res.amount;
          recognizedBookingsInPeriod.push(b);
        } catch {
          incompleteData = true;
        }
      }
    }

    // 2. Vendor Cost: payables in reporting interval
    let vendorCostXof = 0;
    let vendorAmountPaidXof = 0;
    for (const p of allPayables) {
      const pDateMs = Date.parse(p.createdAt);
      if (pDateMs < startMs || pDateMs > endMs) continue;

      try {
        const dueXof =
          p.amountDueXof ??
          fxRateRepository.convertHistorical(p.amountDue, p.currency, "XOF", p.createdAt).amount;
        const paidXof =
          p.amountPaidXof ??
          fxRateRepository.convertHistorical(p.amountPaid, p.currency, "XOF", p.createdAt).amount;
        vendorCostXof += dueXof;
        vendorAmountPaidXof += paidXof;
      } catch {
        incompleteData = true;
      }
    }

    // 3. Gross Margin: Revenue - Cost
    const grossMarginXof = customerRevenueXof - vendorCostXof;
    const grossMarginPercentage =
      customerRevenueXof > 0 ? Number(((grossMarginXof / customerRevenueXof) * 100).toFixed(1)) : 0;

    // 4 & 5. Payments Received & Refunds Issued in interval
    let paymentsReceivedXof = 0;
    let refundsIssuedXof = 0;
    for (const pmt of allPayments) {
      const pmtDateMs = Date.parse(pmt.createdAt);
      if (pmtDateMs < startMs || pmtDateMs > endMs) continue;

      try {
        const settledXof = fxRateRepository.convertHistorical(
          pmt.settledAmount,
          pmt.currency,
          "XOF",
          pmt.createdAt,
        ).amount;
        const refundedXof = fxRateRepository.convertHistorical(
          pmt.refundedAmount,
          pmt.currency,
          "XOF",
          pmt.createdAt,
        ).amount;
        paymentsReceivedXof += settledXof;
        refundsIssuedXof += refundedXof;
      } catch {
        incompleteData = true;
      }
    }

    // 6. Outstanding Customer Balance:
    // Isolated booking-level receivables: Math.max(0, bObligation - (bSettled - bRefunded))
    let outstandingCustomerBalanceXof = 0;
    for (const b of recognizedBookingsInPeriod) {
      try {
        const bObligationXof = fxRateRepository.convertHistorical(
          b.priceAmount,
          b.currency,
          "XOF",
          b.createdAt,
        ).amount;

        const bPayments = allPayments.filter(
          (pmt) => pmt.bookingId === b.id || pmt.bookingReference === b.reference,
        );

        let bSettledXof = 0;
        let bRefundedXof = 0;
        for (const pmt of bPayments) {
          bSettledXof += fxRateRepository.convertHistorical(
            pmt.settledAmount,
            pmt.currency,
            "XOF",
            pmt.createdAt,
          ).amount;
          bRefundedXof += fxRateRepository.convertHistorical(
            pmt.refundedAmount,
            pmt.currency,
            "XOF",
            pmt.createdAt,
          ).amount;
        }

        const bookingReceivable = Math.max(0, bObligationXof - (bSettledXof - bRefundedXof));
        outstandingCustomerBalanceXof += bookingReceivable;
      } catch {
        incompleteData = true;
      }
    }

    // 7. Vendor Amount Due: Vendor Cost - Vendor Amount Paid
    const vendorAmountDueXof = Math.max(0, vendorCostXof - vendorAmountPaidXof);

    return {
      customerRevenueXof,
      vendorCostXof,
      grossMarginXof,
      grossMarginPercentage,
      paymentsReceivedXof,
      refundsIssuedXof,
      outstandingCustomerBalanceXof,
      vendorAmountDueXof,
      incompleteData: incompleteData ? true : undefined,
      dateRange,
    };
  }
}

export const financialReportingService = new FinancialReportingService();
