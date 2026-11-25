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
   */
  public getFinancialSummaryMetrics(
    actor: AuthorizedActor | null | undefined,
    _dateRange?: FinancialDateRange,
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

    // 1. Customer Revenue: sum of confirmed/active bookings converted to XOF
    const allBookings = bookingRepository.listBookings({ pageSize: 100 }).items;
    let customerRevenueXof = 0;
    for (const b of allBookings) {
      if (b.lifecycleStatus !== "CANCELLED" && b.lifecycleStatus !== "REJECTED") {
        const xof = fxRateRepository.convert(b.priceAmount, b.currency, "XOF");
        customerRevenueXof += xof;
      }
    }

    // 2. Vendor Cost: sum of vendor payable amounts due converted to XOF
    const allPayables = vendorPayableRepository.listPayables(actor);
    let vendorCostXof = 0;
    let vendorAmountPaidXof = 0;
    for (const p of allPayables) {
      const dueXof = fxRateRepository.convert(p.amountDue, p.currency, "XOF");
      const paidXof = fxRateRepository.convert(p.amountPaid, p.currency, "XOF");
      vendorCostXof += dueXof;
      vendorAmountPaidXof += paidXof;
    }

    // 3. Gross Margin: Revenue - Cost
    const grossMarginXof = customerRevenueXof - vendorCostXof;
    const grossMarginPercentage =
      customerRevenueXof > 0 ? Number(((grossMarginXof / customerRevenueXof) * 100).toFixed(1)) : 0;

    // 4 & 5. Payments Received & Refunds Issued
    const allPayments = paymentRepository.listPayments();
    let paymentsReceivedXof = 0;
    let refundsIssuedXof = 0;
    for (const pmt of allPayments) {
      const settledXof = fxRateRepository.convert(pmt.settledAmount, pmt.currency, "XOF");
      const refundedXof = fxRateRepository.convert(pmt.refundedAmount, pmt.currency, "XOF");
      paymentsReceivedXof += settledXof;
      refundsIssuedXof += refundedXof;
    }

    // 6. Outstanding Customer Balance: Customer Revenue - (Payments Received - Refunds Issued)
    const netReceived = paymentsReceivedXof - refundsIssuedXof;
    const outstandingCustomerBalanceXof = Math.max(0, customerRevenueXof - netReceived);

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
    };
  }
}

export const financialReportingService = new FinancialReportingService();
