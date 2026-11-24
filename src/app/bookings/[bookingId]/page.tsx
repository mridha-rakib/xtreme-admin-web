"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { StaleVersionConflictError, bookingRepository } from "@/lib/mock/bookings";
import type { Booking } from "@/types/booking";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigneeName, setAssigneeName] = useState("Elena Rostova");
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const loadBooking = () => {
      const resolved = bookingRepository.getBookingById(bookingId);
      if (resolved) {
        setBooking({ ...resolved });
      } else {
        setBooking(null);
      }
    };

    loadBooking();
    const unsubscribe = bookingRepository.subscribe(loadBooking);
    return () => unsubscribe();
  }, [bookingId]);

  if (booking === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading booking details...</div>
      </CommandCenterShell>
    );
  }

  if (booking === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Booking Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              No booking record exists for identifier &ldquo;{bookingId}&rdquo;.
            </p>
            <Link
              href="/bookings"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Bookings List
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  const handleConfirm = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);
    try {
      bookingRepository.confirmBooking(booking.id, booking.version);
      setSuccessMessage(
        `Booking ${booking.reference} confirmed successfully (v${booking.version + 1}).`,
      );
    } catch (err) {
      if (err instanceof StaleVersionConflictError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);
    try {
      bookingRepository.updateBookingStatus(booking.id, "REJECTED", booking.version);
      setSuccessMessage(`Booking ${booking.reference} rejected.`);
    } catch (err) {
      if (err instanceof StaleVersionConflictError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const updated = bookingRepository.getBookingById(booking.id);
    if (updated) {
      updated.assignmentStatus = "ASSIGNED";
      updated.assignedStaffName = assigneeName;
      bookingRepository.confirmBooking(booking.id, booking.version);
      setShowAssignModal(false);
      setSuccessMessage(`Assignment created for ${assigneeName}.`);
    }
  };

  const hasPendingChange =
    booking.changeRequestStatus === "PENDING_MODIFICATION" ||
    booking.changeRequestStatus === "PENDING_CANCELLATION";

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1140px] w-full"
        data-node-id="81:362"
        data-name="CC-BKG-02__Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/bookings"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Bookings List
          </Link>
        </div>

        {/* Header with Title and Version Chip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="81:401"
            >
              Booking Detail / Operations
            </h1>
            <div className="flex items-center gap-[12px] mt-[8px]">
              <span className="text-[14px] font-semibold text-[#0B0C0E]">Booking reference:</span>
              <span className="text-[14px] text-[#5B616B] font-mono">
                {booking.reference} · v{booking.version}
              </span>
            </div>
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-[14px] py-[6px] rounded-full text-[13px] font-semibold tracking-[0.1px] ${
                booking.lifecycleStatus === "CONFIRMED"
                  ? "bg-[#E5F4E3] text-[#226E35]"
                  : booking.lifecycleStatus === "CANCELLED"
                    ? "bg-[#FEECEC] text-[#991B1B]"
                    : "bg-[#f9eccd] text-[#6c4a13]"
              }`}
            >
              {booking.lifecycleStatus.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="mb-[20px] p-[16px] bg-[#FEECEC] border border-[#FCA5A5] rounded-[10px] text-[14px] text-[#991B1B] flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => {
                const refreshed = bookingRepository.getBookingById(booking.id);
                if (refreshed) setBooking({ ...refreshed });
                setErrorMessage(null);
              }}
              className="ml-4 px-3 py-1 bg-[#991B1B] text-white text-xs font-semibold rounded hover:bg-[#7F1D1D] cursor-pointer"
            >
              Reload Authoritative Record
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-[20px] p-[16px] bg-[#E5F4E3] border border-[#A7F3D0] rounded-[10px] text-[14px] text-[#226E35]">
            {successMessage}
          </div>
        )}

        {/* Cards Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[28px]">
          {/* Card 1: Primary Information */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card"
            data-node-id="81:407"
          >
            <div className="bg-[#f4eddf] h-[45px] px-[16px] flex items-center border-b border-[#ded6c9]">
              <h2 className="text-[18px] font-semibold text-[#0B0C0E]">Primary information</h2>
            </div>
            <div className="p-[16px] space-y-[8px]">
              {/* Row 1: Service */}
              <div className="flex items-center border border-[#ded6c9] rounded-[9px] overflow-hidden h-[38px]">
                <div className="w-[182px] h-full bg-[#f4eddf] px-[12px] flex items-center gap-[8px] shrink-0 border-r border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_c0e81ce8-cde.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <span className="text-[13px] font-semibold text-[#5B616B]">Service</span>
                </div>
                <div className="px-[12px] text-[14px] text-[#0B0C0E] truncate font-medium">
                  {booking.serviceName}
                </div>
              </div>

              {/* Row 2: Customer */}
              <div className="flex items-center border border-[#ded6c9] rounded-[9px] overflow-hidden h-[38px]">
                <div className="w-[182px] h-full bg-[#f4eddf] px-[12px] flex items-center gap-[8px] shrink-0 border-r border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_3c3880d9-05b.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <span className="text-[13px] font-semibold text-[#5B616B]">Customer</span>
                </div>
                <div className="px-[12px] text-[14px] text-[#0B0C0E] truncate">
                  <Link
                    href={`/customers/${booking.customerId}`}
                    className="hover:underline text-[#0B0C0E]"
                  >
                    {booking.customerName} · {booking.customerLocation}
                  </Link>
                </div>
              </div>

              {/* Row 3: Schedule */}
              <div className="flex items-center border border-[#ded6c9] rounded-[9px] overflow-hidden h-[38px]">
                <div className="w-[182px] h-full bg-[#f4eddf] px-[12px] flex items-center gap-[8px] shrink-0 border-r border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_58839c79-b60.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <span className="text-[13px] font-semibold text-[#5B616B]">Schedule</span>
                </div>
                <div className="px-[12px] text-[14px] text-[#0B0C0E] truncate">
                  {booking.scheduleDisplay}
                </div>
              </div>

              {/* Row 4: Price / payment */}
              <div className="flex items-center border border-[#ded6c9] rounded-[9px] overflow-hidden h-[38px]">
                <div className="w-[182px] h-full bg-[#f4eddf] px-[12px] flex items-center gap-[8px] shrink-0 border-r border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_297781a3-496.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <span className="text-[13px] font-semibold text-[#5B616B]">Price / payment</span>
                </div>
                <div className="px-[12px] text-[14px] text-[#0B0C0E] truncate">
                  {booking.paymentSummaryDisplay}
                </div>
              </div>

              {/* Row 5: Booking mode */}
              <div className="flex items-center border border-[#ded6c9] rounded-[9px] overflow-hidden h-[38px]">
                <div className="w-[182px] h-full bg-[#f4eddf] px-[12px] flex items-center gap-[8px] shrink-0 border-r border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_61196e11-ba8.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <span className="text-[13px] font-semibold text-[#5B616B]">Booking mode</span>
                </div>
                <div className="px-[12px] text-[14px] text-[#0B0C0E] truncate">
                  {booking.bookingMode === "CONCIERGE_ASSISTED"
                    ? "Concierge-assisted"
                    : "Customer-direct"}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Separate Operational States */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card"
            data-node-id="81:420"
          >
            <div className="bg-[#f4eddf] h-[45px] px-[16px] flex items-center border-b border-[#ded6c9]">
              <h2 className="text-[18px] font-semibold text-[#0B0C0E]">
                Separate operational states
              </h2>
            </div>
            <div className="p-[16px] space-y-[8px]">
              {/* Row 1: Vendor decision */}
              <div className="flex items-center border border-[#ded6c9] rounded-[9px] overflow-hidden h-[38px]">
                <div className="w-[182px] h-full bg-[#f4eddf] px-[12px] flex items-center gap-[8px] shrink-0 border-r border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_7aecbd6a-fdd.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <span className="text-[13px] font-semibold text-[#5B616B]">Vendor decision</span>
                </div>
                <div className="px-[12px]">
                  <span
                    className={`inline-flex items-center px-[8px] py-[2px] rounded-full text-[12px] font-semibold ${
                      booking.vendorDecision === "ACCEPTED"
                        ? "bg-[#E5F4E3] text-[#226E35]"
                        : booking.vendorDecision === "REJECTED"
                          ? "bg-[#FEECEC] text-[#991B1B]"
                          : "bg-[#f9eccd] text-[#6c4a13]"
                    }`}
                  >
                    {booking.vendorDecision}
                  </span>
                </div>
              </div>

              {/* Row 2: Payment */}
              <div className="flex items-center border border-[#ded6c9] rounded-[9px] overflow-hidden h-[38px]">
                <div className="w-[182px] h-full bg-[#f4eddf] px-[12px] flex items-center gap-[8px] shrink-0 border-r border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_297781a3-496.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <span className="text-[13px] font-semibold text-[#5B616B]">Payment</span>
                </div>
                <div className="px-[12px]">
                  <span className="inline-flex items-center px-[8px] py-[2px] rounded-full bg-[#EEE9E0] text-[#5B616B] text-[12px] font-semibold">
                    {booking.paymentStatus.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Row 3: Change request */}
              <div className="flex items-center border border-[#ded6c9] rounded-[9px] overflow-hidden h-[38px]">
                <div className="w-[182px] h-full bg-[#f4eddf] px-[12px] flex items-center gap-[8px] shrink-0 border-r border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_3c231a0f-22d.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <span className="text-[13px] font-semibold text-[#5B616B]">Change request</span>
                </div>
                <div className="px-[12px] flex items-center gap-[8px]">
                  <span
                    className={`inline-flex items-center px-[8px] py-[2px] rounded-full text-[12px] font-semibold ${
                      hasPendingChange
                        ? "bg-[#f9eccd] text-[#6c4a13]"
                        : "bg-[#EEE9E0] text-[#5B616B]"
                    }`}
                  >
                    {booking.changeRequestStatus.replace("_", " ")}
                  </span>
                  {hasPendingChange && (
                    <Link
                      href={`/bookings/${booking.id}/change-requests`}
                      className="text-xs font-semibold text-[#164D53] hover:underline"
                    >
                      View ›
                    </Link>
                  )}
                </div>
              </div>

              {/* Row 4: Assignment */}
              <div className="flex items-center border border-[#ded6c9] rounded-[9px] overflow-hidden h-[38px]">
                <div className="w-[182px] h-full bg-[#f4eddf] px-[12px] flex items-center gap-[8px] shrink-0 border-r border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_3c3880d9-05b.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <span className="text-[13px] font-semibold text-[#5B616B]">Assignment</span>
                </div>
                <div className="px-[12px] text-[14px] text-[#5B616B]">
                  {booking.assignmentStatus === "ASSIGNED" && booking.assignedStaffName
                    ? booking.assignedStaffName
                    : "Unassigned"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-[12px] mb-[28px]">
          {/* Primary Confirm */}
          <button
            type="button"
            disabled={isProcessing || booking.lifecycleStatus === "CONFIRMED"}
            onClick={handleConfirm}
            className="h-[48px] px-[24px] bg-[#0B0C0E] hover:bg-[#17191D] border-[1.2px] border-[#B48737] rounded-[12px] text-white text-[14px] font-semibold disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
          >
            {isProcessing ? "Processing..." : "Confirm"}
          </button>

          {/* Reject */}
          <button
            type="button"
            disabled={isProcessing || booking.lifecycleStatus === "REJECTED"}
            onClick={handleReject}
            className="h-[48px] px-[20px] bg-white hover:bg-[#FAF8F4] border border-[#DDD8CF] rounded-[12px] text-[#991B1B] text-[14px] font-semibold disabled:opacity-40 transition-colors cursor-pointer"
          >
            Reject
          </button>

          {/* Resolve change button */}
          <Link
            href={`/bookings/${booking.id}/change-requests`}
            className="h-[48px] px-[20px] bg-white hover:bg-[#FAF8F4] border border-[#A6A19A] rounded-[12px] text-[#0B0C0E] text-[14px] font-semibold flex items-center justify-center transition-colors cursor-pointer"
          >
            Resolve change
          </Link>

          {/* Create assignment button */}
          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            className="h-[48px] px-[20px] bg-white hover:bg-[#FAF8F4] border border-[#A6A19A] rounded-[12px] text-[#0B0C0E] text-[14px] font-semibold transition-colors cursor-pointer"
          >
            Create assignment
          </button>

          {/* Payment / refund */}
          <button
            type="button"
            onClick={() => setShowPaymentNotice(true)}
            className="h-[48px] px-[20px] bg-white hover:bg-[#FAF8F4] border border-[#DDD8CF] rounded-[12px] text-[#5B616B] text-[14px] font-semibold transition-colors cursor-pointer"
          >
            Payment / refund
          </button>
        </div>

        {/* Authority Guard Bottom Card */}
        <div
          className="bg-[#f1e7d3] border border-[#ddd8cf] rounded-[12px] p-[20px] relative overflow-hidden flex items-start gap-[16px] shadow-xs"
          data-node-id="81:447"
        >
          <div className="w-[24px] h-[24px] shrink-0 mt-[2px] opacity-80">
            <Image src="/figma-assets/bkg_b032f883-5f7.svg" alt="" width={24} height={24} />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-[#0B0C0E] mb-[6px]" data-node-id="81:448">
              Authority guard
            </h3>
            <p
              className="text-[14px] font-normal leading-[22px] text-[#5B616B]"
              data-node-id="81:449"
            >
              Vendor acceptance is not final XTREME confirmation. Actions depend on role +
              permission + resource scope + current state. Stale/409 requires authoritative reload.
            </p>
          </div>
        </div>

        {/* Payment Notice Modal */}
        {showPaymentNotice && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          >
            <div className="w-full max-w-md bg-white border border-[#DDD8CF] rounded-xl shadow-modal p-6">
              <h3 className="text-base font-bold text-[#0B0C0E] pb-3 border-b border-[#DDD8CF]">
                Financial Workflow Policy
              </h3>
              <p className="py-4 text-xs text-[#5B616B]">
                In accordance with XTREME operational state isolation rules, payment collection and
                refund processing are governed independently by the Financial & Billing module
                (Phase 5.x) and cannot be arbitrarily executed from operational booking review.
              </p>
              <div className="flex justify-end pt-3 border-t border-[#DDD8CF]">
                <button
                  type="button"
                  onClick={() => setShowPaymentNotice(false)}
                  className="px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Assignment Modal */}
        {showAssignModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          >
            <form
              onSubmit={handleAssign}
              className="w-full max-w-md bg-white border border-[#DDD8CF] rounded-xl shadow-modal p-6"
            >
              <h3 className="text-base font-bold text-[#0B0C0E] pb-3 border-b border-[#DDD8CF]">
                Assign Operations Lead
              </h3>
              <div className="py-4 space-y-3">
                <label
                  htmlFor="assignee-select"
                  className="block text-xs font-semibold text-[#0B0C0E]"
                >
                  Select Operations Staff
                </label>
                <select
                  id="assignee-select"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#DDD8CF] rounded-md text-sm text-[#0B0C0E]"
                >
                  <option value="Elena Rostova">Elena Rostova (VIP Concierge)</option>
                  <option value="Marcus Reynolds">Marcus Reynolds (Operations Lead)</option>
                  <option value="Chef Antoine Dupont">Chef Antoine Dupont (Culinary)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#DDD8CF]">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-white border border-[#DDD8CF] text-xs font-semibold rounded-md text-[#0B0C0E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </CommandCenterShell>
  );
}
