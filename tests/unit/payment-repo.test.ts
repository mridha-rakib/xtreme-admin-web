import {
  PaymentValidationError,
  UnauthorizedPaymentAccessError,
  UnauthorizedRefundRoleError,
  paymentRepository,
} from "@/lib/mock/payments";
import type { AuthorizedActor } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";

const adminActor: AuthorizedActor = {
  id: "usr_admin",
  role: "ADMIN",
};

const vendorActorA: AuthorizedActor = {
  id: "usr_vendor_a",
  role: "VENDOR",
  vendorId: "vnd_005",
};

const vendorActorB: AuthorizedActor = {
  id: "usr_vendor_b",
  role: "VENDOR",
  vendorId: "vnd_azure_01",
};

describe("PaymentRepository Unit & Domain Model Tests", () => {
  beforeEach(() => {
    paymentRepository.resetDefaults();
  });

  it("lists initial seeded payments with correct financial amounts", () => {
    const payments = paymentRepository.listPayments();
    expect(payments.length).toBeGreaterThanOrEqual(4);

    const pmt018 = paymentRepository.getPaymentById("pmt_018_1");
    expect(pmt018).toBeDefined();
    expect(pmt018?.bookingId).toBe("bkg_018");
    expect(pmt018?.purpose).toBe("FULL");
    expect(pmt018?.amount).toBe(185);
    expect(pmt018?.status).toBe("CAPTURED");
    expect(pmt018?.refundableRemainder).toBe(185);
    expect(pmt018?.refundedAmount).toBe(0);
  });

  it("lists multiple payments for split-deposit booking", () => {
    const bkg017Payments = paymentRepository.listPaymentsByBooking("bkg_017");
    expect(bkg017Payments.length).toBe(2);

    const deposit = bkg017Payments.find((p) => p.purpose === "DEPOSIT");
    const balance = bkg017Payments.find((p) => p.purpose === "BALANCE");

    expect(deposit?.amount).toBe(300);
    expect(deposit?.status).toBe("CAPTURED");
    expect(deposit?.refundableRemainder).toBe(300);

    expect(balance?.amount).toBe(350);
    expect(balance?.status).toBe("AUTHORIZED");
    expect(balance?.refundableRemainder).toBe(0); // Not settled yet
  });

  it("strictly restricts refund initiation to Admin / Super Admin roles", () => {
    expect(() =>
      paymentRepository.initiateRefund({
        paymentId: "pmt_018_1",
        amount: 50,
        reason: "Customer requested adjustment",
        requestedByRole: "CONCIERGE",
      }),
    ).toThrow(UnauthorizedRefundRoleError);

    expect(() =>
      paymentRepository.initiateRefund({
        paymentId: "pmt_018_1",
        amount: 50,
        reason: "Customer requested adjustment",
        requestedByRole: "VENDOR",
      }),
    ).toThrow(UnauthorizedRefundRoleError);
  });

  it("rejects non-positive refund amounts", () => {
    expect(() =>
      paymentRepository.initiateRefund({
        paymentId: "pmt_018_1",
        amount: 0,
        reason: "Zero test",
        requestedByRole: "ADMIN",
      }),
    ).toThrow(PaymentValidationError);

    expect(() =>
      paymentRepository.initiateRefund({
        paymentId: "pmt_018_1",
        amount: -10,
        reason: "Negative test",
        requestedByRole: "ADMIN",
      }),
    ).toThrow(PaymentValidationError);
  });

  it("rejects refund amounts exceeding the refundable remainder", () => {
    expect(() =>
      paymentRepository.initiateRefund({
        paymentId: "pmt_018_1",
        amount: 200, // Total is 185
        reason: "Excessive refund",
        requestedByRole: "SUPER_ADMIN",
      }),
    ).toThrow(PaymentValidationError);
  });

  it("rejects refund on unsettled / non-captured payment", () => {
    expect(() =>
      paymentRepository.initiateRefund({
        paymentId: "pmt_017_2", // AUTHORIZED status, settledAmount = 0
        amount: 100,
        reason: "Refund attempt on authorized",
        requestedByRole: "ADMIN",
      }),
    ).toThrow(PaymentValidationError);
  });

  it("processes partial refund and updates refundable remainder", () => {
    const refund = paymentRepository.initiateRefund({
      paymentId: "pmt_018_1",
      amount: 85,
      reason: "VIP partial courtesy refund",
      requestedByRole: "SUPER_ADMIN",
    });

    expect(refund.id).toBeDefined();
    expect(refund.amount).toBe(85);
    expect(refund.status).toBe("COMPLETED");

    const updated = paymentRepository.getPaymentById("pmt_018_1");
    expect(updated?.refundedAmount).toBe(85);
    expect(updated?.refundableRemainder).toBe(100);
    expect(updated?.status).toBe("CAPTURED");
    expect(updated?.refunds.length).toBe(1);
  });

  it("processes full refund and marks payment status as REFUNDED", () => {
    paymentRepository.initiateRefund({
      paymentId: "pmt_018_1",
      amount: 185,
      reason: "Full trip cancellation refund",
      requestedByRole: "ADMIN",
    });

    const updated = paymentRepository.getPaymentById("pmt_018_1");
    expect(updated?.refundedAmount).toBe(185);
    expect(updated?.refundableRemainder).toBe(0);
    expect(updated?.status).toBe("REFUNDED");
  });

  it("enforces tenant isolation: vendor only sees payments for own bookings", () => {
    // bkg_018 belongs to vnd_aerojet_99
    const vendorAPayments = paymentRepository.listPayments(vendorActorA);
    expect(vendorAPayments.length).toBeGreaterThan(0);
    expect(vendorAPayments.every((p) => p.bookingId === "bkg_018")).toBe(true);

    // Vendor B cannot access Vendor A payment
    expect(() => {
      paymentRepository.getPaymentById("pmt_018_1", vendorActorB);
    }).toThrow(UnauthorizedPaymentAccessError);
  });

  it("accounts for pendingRefundAmount in eligible refundable remainder calculation", () => {
    const payment = paymentRepository.getPaymentById("pmt_018_1");
    expect(payment).toBeDefined();
    if (payment) {
      payment.pendingRefundAmount = 50; // 185 total - 50 pending = 135 remainder
      payment.refundableRemainder = 135;

      // Requesting 150 exceeds 135 eligible remainder
      expect(() => {
        paymentRepository.initiateRefund({
          paymentId: "pmt_018_1",
          amount: 150,
          reason: "Over limit test",
          requestedByRole: "ADMIN",
        });
      }).toThrow(/exceeds eligible refundable remainder/);

      // Requesting 100 succeeds
      const ref = paymentRepository.initiateRefund({
        paymentId: "pmt_018_1",
        amount: 100,
        reason: "Valid partial",
        requestedByRole: "ADMIN",
      });
      expect(ref.amount).toBe(100);
      expect(payment.refundableRemainder).toBe(35); // 185 - 100 - 50
    }
  });

  it("validates currency precision on refund requests", () => {
    expect(() => {
      paymentRepository.initiateRefund({
        paymentId: "pmt_018_1",
        amount: 50.125, // USD supports max 2 decimal places
        reason: "Invalid decimals",
        requestedByRole: "ADMIN",
      });
    }).toThrow(/maximum of 2 decimal places/);
  });
});
