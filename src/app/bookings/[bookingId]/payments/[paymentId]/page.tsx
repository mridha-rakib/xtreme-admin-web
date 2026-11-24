"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { bookingRepository } from "@/lib/mock/bookings";
import { PaymentValidationError, paymentRepository } from "@/lib/mock/payments";
import type { Booking } from "@/types/booking";
import type { PaymentRecord } from "@/types/payment";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const paymentId = params?.paymentId as string;
  const { user } = useSession();

  const [payment, setPayment] = useState<PaymentRecord | null | undefined>(undefined);
  const [booking, setBooking] = useState<Booking | null>(null);

  // Refund Form State
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;

    const loadData = () => {
      const p = paymentRepository.getPaymentById(paymentId);
      if (p) {
        setPayment({ ...p });
        setRefundAmount(p.refundableRemainder);
        const b = bookingRepository.getBookingById(p.bookingId);
        setBooking(b || null);
      } else {
        // Try finding by booking ID fallback
        const paymentsForBooking = paymentRepository.listPaymentsByBooking(bookingId);
        if (paymentsForBooking.length > 0) {
          const first = paymentsForBooking[0];
          setPayment({ ...first });
          setRefundAmount(first.refundableRemainder);
          const b = bookingRepository.getBookingById(first.bookingId);
          setBooking(b || null);
        } else {
          setPayment(null);
        }
      }
    };

    loadData();
    const unsubscribe = paymentRepository.subscribe(loadData);
    return () => unsubscribe();
  }, [paymentId, bookingId]);

  if (payment === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading payment record...</div>
      </CommandCenterShell>
    );
  }

  if (payment === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Payment Record Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              No payment record exists for identifier &ldquo;{paymentId}&rdquo;.
            </p>
            <Link
              href={bookingId ? `/bookings/${bookingId}` : "/bookings"}
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Booking
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  const isRefundAuthorized = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isRefundAuthorized) {
      setErrorMessage("Refund management requires Admin or Super Admin privileges.");
      return;
    }

    if (refundAmount <= 0) {
      setErrorMessage("Refund amount must be strictly greater than 0.");
      return;
    }

    if (refundAmount > payment.refundableRemainder) {
      setErrorMessage(
        `Refund amount cannot exceed eligible refundable remainder of ${payment.currency} ${payment.refundableRemainder}.`,
      );
      return;
    }

    if (!refundReason.trim()) {
      setErrorMessage("Please state an operational reason for the refund.");
      return;
    }

    setIsSubmitting(true);
    try {
      const refund = paymentRepository.initiateRefund({
        paymentId: payment.id,
        amount: refundAmount,
        reason: refundReason.trim(),
        requestedByRole: user?.role || "ADMIN",
      });

      setSuccessMessage(
        `Refund of ${payment.currency} ${refund.amount.toLocaleString()} initiated successfully (ID: ${refund.id}). Authoritative payment balance reconciled.`,
      );
      setRefundReason("");
    } catch (err) {
      if (err instanceof PaymentValidationError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while processing the refund.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1140px] w-full"
        data-node-id="81:777"
        data-name="CC-PAY-01__Admin_/_Super_Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href={`/bookings/${payment.bookingId}`}
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Booking ({payment.bookingReference})
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="81:816"
            >
              Payment Detail / Refund Management
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-PAY-01 (Node 81:777) · Scoped to Admin / Super Admin
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F1EFEA] border border-[#DDD8CF] rounded-full text-xs font-semibold text-[#0B0C0E] self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#9B1C1C]" />
            Admin / Super Admin
          </div>
        </div>

        {/* Operational Authority Notice */}
        <div
          className="mb-[24px] p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[10px] text-[13px] text-[#5B616B] flex items-start gap-3"
          data-node-id="81:818"
        >
          <span className="font-bold text-[#0B0C0E] text-base leading-none">ℹ</span>
          <div>
            <p className="font-semibold text-[#0B0C0E]">Domain Authority Notice</p>
            <p className="mt-0.5">
              A payment return or client gateway confirmation is not authoritative final truth.
              Operational booking confirmation remains strictly decoupled from payment processing
              and refund execution.
            </p>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="mb-[24px] p-4 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[10px] text-[#9B1C1C] text-[14px] font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-[#9B1C1C] font-bold text-sm ml-4"
            >
              ✕
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-[24px] p-4 bg-[#DEF7EC] border border-[#84E1BC] rounded-[10px] text-[#03543F] text-[14px] font-medium">
            {successMessage}
          </div>
        )}

        <div className="space-y-[24px]">
          {/* Card 1: Authoritative Payment State */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="81:820"
          >
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px]">
                Authoritative payment state
              </h2>
              <span
                className={`px-3 py-1 text-[12px] font-bold rounded-full ${
                  payment.status === "CAPTURED" || payment.status === "REFUNDED"
                    ? "bg-[#DEF7EC] text-[#03543F]"
                    : payment.status === "AUTHORIZED"
                      ? "bg-[#FEF08A] text-[#854D0E]"
                      : "bg-[#F3F4F6] text-[#374151]"
                }`}
              >
                {payment.status === "CAPTURED" ? "SUCCEEDED" : payment.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Payment
                </span>
                <span className="block text-[15px] font-mono font-bold text-[#0B0C0E] mt-1">
                  {payment.id}
                </span>
                <span className="block text-[12px] text-[#5B616B] mt-0.5">
                  Created: {new Date(payment.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Booking Reference
                </span>
                <Link
                  href={`/bookings/${payment.bookingId}`}
                  className="block text-[15px] font-bold text-[#164D53] hover:underline mt-1"
                >
                  {payment.bookingReference}
                </Link>
                <span className="block text-[12px] text-[#5B616B] mt-0.5">
                  {booking?.serviceName || "VIP Service"}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Purpose
                </span>
                <span className="block text-[15px] font-semibold text-[#0B0C0E] mt-1">
                  {payment.purpose} PAYMENT
                </span>
                <span className="block text-[12px] text-[#5B616B] mt-0.5">
                  Transaction Currency: {payment.currency}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Provider ref
                </span>
                <span className="block text-[15px] font-mono text-[#0B0C0E] mt-1 truncate">
                  {payment.providerRef}
                </span>
                <span className="block text-[12px] text-[#5B616B] mt-0.5">
                  Provider status: {payment.providerStatus}
                </span>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="mt-6 pt-6 border-t border-[#DDD8CF] grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-[#FAF8F4] rounded-[8px]">
                <span className="text-[11px] font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Total Billed
                </span>
                <span className="text-[18px] font-bold text-[#0B0C0E] mt-1 block">
                  {payment.currency}{" "}
                  {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F4] rounded-[8px]">
                <span className="text-[11px] font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Settled Amount
                </span>
                <span className="text-[18px] font-bold text-[#03543F] mt-1 block">
                  {payment.currency}{" "}
                  {payment.settledAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F4] rounded-[8px]">
                <span className="text-[11px] font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Refunded Amount
                </span>
                <span className="text-[18px] font-bold text-[#9B1C1C] mt-1 block">
                  {payment.currency}{" "}
                  {payment.refundedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F4] rounded-[8px]">
                <span className="text-[11px] font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Refundable Remainder
                </span>
                <span className="text-[18px] font-bold text-[#0B0C0E] mt-1 block">
                  {payment.currency}{" "}
                  {payment.refundableRemainder.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Existing Refunds History */}
          <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card">
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-[16px]">
              Refund Transactions
            </h2>

            {payment.refunds.length === 0 ? (
              <div className="py-8 text-center text-[14px] text-[#5B616B] border border-dashed border-[#DDD8CF] rounded-[8px]">
                No refund transactions have been initiated for this payment record.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#DDD8CF] text-[#5B616B]">
                      <th className="pb-3 font-semibold">Refund ID</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Reason</th>
                      <th className="pb-3 font-semibold">Initiated By</th>
                      <th className="pb-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD8CF]">
                    {payment.refunds.map((ref) => (
                      <tr key={ref.id} className="text-[#0B0C0E]">
                        <td className="py-3 font-mono font-medium">{ref.id}</td>
                        <td className="py-3 font-bold text-[#9B1C1C]">
                          - {ref.currency}{" "}
                          {ref.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#DEF7EC] text-[#03543F]">
                            {ref.status}
                          </span>
                        </td>
                        <td className="py-3 text-[#5B616B]">{ref.reason}</td>
                        <td className="py-3 font-medium">{ref.requestedByRole}</td>
                        <td className="py-3 text-[#5B616B]">
                          {new Date(ref.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 3: Initiate Refund Management Form */}
          <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card">
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px]">
              Initiate Refund
            </h2>
            <p className="text-[13px] text-[#5B616B] mt-1 mb-[20px]">
              Refund execution settles through the simulated payment gateway and adjusts the
              eligible balance. Booking operational state remains governed by its own lifecycle.
            </p>

            {!isRefundAuthorized ? (
              <div className="p-4 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[8px] text-[13px] text-[#9B1C1C]">
                <strong>Access Restricted:</strong> Current persona &ldquo;{user?.role || "GUEST"}
                &rdquo; is not permitted to initiate refunds. Refund management is restricted to
                Admin / Super Admin.
              </div>
            ) : payment.refundableRemainder <= 0 ? (
              <div className="p-4 bg-[#F3F4F6] border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#5B616B]">
                This transaction has <strong>zero remaining refundable balance</strong>. No further
                refunds can be initiated.
              </div>
            ) : (
              <form onSubmit={handleRefundSubmit} className="space-y-4 max-w-[600px]">
                <div>
                  <label
                    htmlFor="refund-amount-input"
                    className="block text-[14px] font-semibold text-[#0B0C0E] mb-1"
                  >
                    Refund Amount ({payment.currency}) <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="refund-amount-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={payment.refundableRemainder}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number.parseFloat(e.target.value) || 0)}
                      className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    />
                    <button
                      type="button"
                      onClick={() => setRefundAmount(payment.refundableRemainder)}
                      className="absolute right-3 top-2.5 px-2 py-1 text-xs bg-[#F1EFEA] text-[#0B0C0E] rounded font-medium hover:bg-[#E5E2DC]"
                    >
                      Max: {payment.refundableRemainder}
                    </button>
                  </div>
                  <p className="text-[12px] text-[#5B616B] mt-1">
                    Maximum refundable: {payment.currency} {payment.refundableRemainder}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="refund-reason-input"
                    className="block text-[14px] font-semibold text-[#0B0C0E] mb-1"
                  >
                    Refund Reason / Operational Note <span className="text-[#DC2626]">*</span>
                  </label>
                  <textarea
                    id="refund-reason-input"
                    rows={3}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Enter reason (e.g. Booking cancellation agreed with customer, VIP courtesy adjustment)..."
                    className="w-full p-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                  />
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      refundAmount <= 0 ||
                      refundAmount > payment.refundableRemainder
                    }
                    className="h-[48px] px-[24px] bg-[#9B1C1C] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#771D1D] disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting
                      ? "Processing Refund..."
                      : `Process Refund (${payment.currency} ${refundAmount || 0})`}
                  </button>
                  <Link
                    href={`/bookings/${payment.bookingId}`}
                    className="h-[48px] px-[24px] bg-white border border-[#A6A19A] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] transition-colors inline-flex items-center"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </CommandCenterShell>
  );
}
