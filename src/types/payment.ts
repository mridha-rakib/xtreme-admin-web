import type { PaymentLifecycleStatus } from "./booking";

export type PaymentPurpose = "FULL" | "DEPOSIT" | "BALANCE";

export type RefundStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface RefundRecord {
  id: string;
  paymentId: string;
  bookingId: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  requestedByRole: string;
  createdAt: string;
  completedAt?: string;
  reconciliationNotes?: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  bookingReference: string;
  purpose: PaymentPurpose;
  amount: number;
  currency: string;
  status: PaymentLifecycleStatus;
  providerRef: string;
  providerStatus: string;
  settledAmount: number;
  refundedAmount: number;
  pendingRefundAmount: number;
  refundableRemainder: number;
  refunds: RefundRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface InitiateRefundParams {
  paymentId: string;
  amount: number;
  reason: string;
  requestedByRole: string;
}
