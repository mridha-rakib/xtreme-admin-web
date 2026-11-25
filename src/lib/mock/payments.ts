import { bookingRepository, getVendorIdForBooking } from "@/lib/mock/bookings";
import type { AuthorizedActor } from "@/types";
import type { InitiateRefundParams, PaymentRecord, RefundRecord } from "@/types/payment";

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export class UnauthorizedRefundRoleError extends Error {
  constructor(role: string) {
    super(
      `Role '${role}' is not authorized to initiate refunds. Refund management requires Admin or Super Admin privileges.`,
    );
    this.name = "UnauthorizedRefundRoleError";
  }
}

export class UnauthorizedPaymentAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedPaymentAccessError";
  }
}

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: "pmt_018_1",
    bookingId: "bkg_018",
    bookingReference: "XC-261124-018",
    purpose: "FULL",
    amount: 185,
    currency: "USD",
    status: "CAPTURED",
    providerRef: "ch_3O7q8L2eZvKYlo2C0p",
    providerStatus: "succeeded",
    settledAmount: 185,
    refundedAmount: 0,
    pendingRefundAmount: 0,
    refundableRemainder: 185,
    refunds: [],
    createdAt: "2026-11-23T18:05:00Z",
    updatedAt: "2026-11-23T18:05:00Z",
  },
  {
    id: "pmt_017_1",
    bookingId: "bkg_017",
    bookingReference: "XC-261124-017",
    purpose: "DEPOSIT",
    amount: 300,
    currency: "USD",
    status: "CAPTURED",
    providerRef: "ch_3O7m9B1aZvKYlo2D1q",
    providerStatus: "succeeded",
    settledAmount: 300,
    refundedAmount: 0,
    pendingRefundAmount: 0,
    refundableRemainder: 300,
    refunds: [],
    createdAt: "2026-11-22T14:35:00Z",
    updatedAt: "2026-11-22T14:35:00Z",
  },
  {
    id: "pmt_017_2",
    bookingId: "bkg_017",
    bookingReference: "XC-261124-017",
    purpose: "BALANCE",
    amount: 350,
    currency: "USD",
    status: "AUTHORIZED",
    providerRef: "pi_3O7m9B1aZvKYlo2D1b",
    providerStatus: "requires_capture",
    settledAmount: 0,
    refundedAmount: 0,
    pendingRefundAmount: 0,
    refundableRemainder: 0,
    refunds: [],
    createdAt: "2026-11-22T14:35:00Z",
    updatedAt: "2026-11-22T14:35:00Z",
  },
  {
    id: "pmt_016_1",
    bookingId: "bkg_016",
    bookingReference: "XC-261124-016",
    purpose: "FULL",
    amount: 2400,
    currency: "USD",
    status: "PAYMENT_DUE",
    providerRef: "pi_3O7k2A9cZvKYlo2E3f",
    providerStatus: "requires_payment_method",
    settledAmount: 0,
    refundedAmount: 0,
    pendingRefundAmount: 0,
    refundableRemainder: 0,
    refunds: [],
    createdAt: "2026-11-23T09:00:00Z",
    updatedAt: "2026-11-23T09:00:00Z",
  },
];

export class PaymentRepository {
  private payments: PaymentRecord[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.payments = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const fn of this.listeners) {
      fn();
    }
  }

  public listPayments(actor?: AuthorizedActor): PaymentRecord[] {
    if (actor?.role === "VENDOR") {
      if (!actor.vendorId) {
        throw new UnauthorizedPaymentAccessError(
          "Vendor actor has no associated vendor organization membership.",
        );
      }
      return this.payments.filter((p) => {
        const b = bookingRepository.getBookingById(p.bookingId);
        if (!b) return false;
        const vendorId = getVendorIdForBooking(b);
        return vendorId.toLowerCase() === actor.vendorId?.toLowerCase();
      });
    }
    return [...this.payments];
  }

  public getPaymentById(paymentId: string, actor?: AuthorizedActor): PaymentRecord | undefined {
    const p = this.payments.find((item) => item.id === paymentId);
    if (!p) return undefined;
    if (actor?.role === "VENDOR") {
      if (!actor.vendorId) {
        throw new UnauthorizedPaymentAccessError(
          "Vendor actor has no associated vendor organization membership.",
        );
      }
      const b = bookingRepository.getBookingById(p.bookingId);
      if (!b || getVendorIdForBooking(b).toLowerCase() !== actor.vendorId.toLowerCase()) {
        throw new UnauthorizedPaymentAccessError(
          "Unauthorized: Cannot access payment belonging to another vendor organization.",
        );
      }
    }
    return p;
  }

  public listPaymentsByBooking(bookingId: string, actor?: AuthorizedActor): PaymentRecord[] {
    if (actor?.role === "VENDOR") {
      if (!actor.vendorId) {
        throw new UnauthorizedPaymentAccessError(
          "Vendor actor has no associated vendor organization membership.",
        );
      }
      const b = bookingRepository.getBookingById(bookingId);
      if (!b || getVendorIdForBooking(b).toLowerCase() !== actor.vendorId.toLowerCase()) {
        throw new UnauthorizedPaymentAccessError(
          "Unauthorized: Cannot access payments for another vendor organization.",
        );
      }
    }
    return this.payments.filter((p) => p.bookingId === bookingId);
  }

  public initiateRefund(params: InitiateRefundParams, actor?: AuthorizedActor): RefundRecord {
    const payment = this.getPaymentById(params.paymentId, actor);
    if (!payment) {
      throw new PaymentValidationError(`Payment not found: ${params.paymentId}`);
    }

    // Role check: Only ADMIN or SUPER_ADMIN may initiate refunds
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    const effectiveRole = actor?.role || params.requestedByRole;
    if (!allowedRoles.includes(effectiveRole)) {
      throw new UnauthorizedRefundRoleError(effectiveRole);
    }

    if (payment.status !== "CAPTURED" && payment.settledAmount <= 0) {
      throw new PaymentValidationError(
        `Cannot refund payment in '${payment.status}' status. Only captured/settled payments are eligible for refund.`,
      );
    }

    if (
      typeof params.amount !== "number" ||
      !Number.isFinite(params.amount) ||
      params.amount <= 0
    ) {
      throw new PaymentValidationError(
        "Refund amount must be a finite number strictly greater than 0.",
      );
    }

    if (params.amount > Number.MAX_SAFE_INTEGER) {
      throw new PaymentValidationError("Refund amount exceeds maximum safe numerical limit.");
    }

    const cur = payment.currency.toUpperCase().trim();
    if (cur === "XOF" && !Number.isInteger(params.amount)) {
      throw new PaymentValidationError(
        "XOF is a zero-decimal integer currency. Fractional refund amounts are not permitted.",
      );
    }
    const str = params.amount.toString();
    const dotIdx = str.indexOf(".");
    if (dotIdx !== -1 && str.length - dotIdx - 1 > 2) {
      throw new PaymentValidationError(`Currency ${cur} supports a maximum of 2 decimal places.`);
    }

    const effectiveRefundable = Math.max(
      0,
      payment.settledAmount - payment.refundedAmount - payment.pendingRefundAmount,
    );

    if (params.amount > effectiveRefundable) {
      throw new PaymentValidationError(
        `Refund amount (${params.amount} ${payment.currency}) exceeds eligible refundable remainder (${effectiveRefundable} ${payment.currency}).`,
      );
    }

    const now = new Date().toISOString();
    const refundId = `ref_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newRefund: RefundRecord = {
      id: refundId,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      amount: params.amount,
      currency: payment.currency,
      reason: params.reason || "Operational adjustment / customer cancellation",
      status: "COMPLETED",
      requestedByRole: effectiveRole,
      createdAt: now,
      completedAt: now,
      reconciliationNotes: "Simulated gateway refund settlement completed",
    };

    payment.refunds.unshift(newRefund);
    payment.refundedAmount += params.amount;
    payment.refundableRemainder = Math.max(
      0,
      payment.settledAmount - payment.refundedAmount - payment.pendingRefundAmount,
    );
    payment.updatedAt = now;

    if (payment.refundableRemainder === 0 && payment.pendingRefundAmount === 0) {
      payment.status = "REFUNDED";
    }

    this.notify();
    return newRefund;
  }

  public resetDefaults(): void {
    this.payments = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
    this.notify();
  }
}

export const paymentRepository = new PaymentRepository();
