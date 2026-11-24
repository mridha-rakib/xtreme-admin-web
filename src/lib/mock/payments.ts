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

  public listPayments(): PaymentRecord[] {
    return [...this.payments];
  }

  public getPaymentById(paymentId: string): PaymentRecord | undefined {
    return this.payments.find((p) => p.id === paymentId);
  }

  public listPaymentsByBooking(bookingId: string): PaymentRecord[] {
    return this.payments.filter((p) => p.bookingId === bookingId);
  }

  public initiateRefund(params: InitiateRefundParams): RefundRecord {
    const payment = this.getPaymentById(params.paymentId);
    if (!payment) {
      throw new PaymentValidationError(`Payment not found: ${params.paymentId}`);
    }

    // Role check: Only ADMIN or SUPER_ADMIN may initiate refunds
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(params.requestedByRole)) {
      throw new UnauthorizedRefundRoleError(params.requestedByRole);
    }

    if (payment.status !== "CAPTURED" && payment.settledAmount <= 0) {
      throw new PaymentValidationError(
        `Cannot refund payment in '${payment.status}' status. Only captured/settled payments are eligible for refund.`,
      );
    }

    if (params.amount <= 0) {
      throw new PaymentValidationError("Refund amount must be strictly greater than 0.");
    }

    if (params.amount > payment.refundableRemainder) {
      throw new PaymentValidationError(
        `Refund amount (${params.amount} ${payment.currency}) exceeds eligible refundable remainder (${payment.refundableRemainder} ${payment.currency}).`,
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
      requestedByRole: params.requestedByRole,
      createdAt: now,
      completedAt: now,
      reconciliationNotes: "Simulated gateway refund settlement completed",
    };

    payment.refunds.unshift(newRefund);
    payment.refundedAmount += params.amount;
    payment.refundableRemainder = Math.max(0, payment.settledAmount - payment.refundedAmount);
    payment.updatedAt = now;

    if (payment.refundableRemainder === 0) {
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
