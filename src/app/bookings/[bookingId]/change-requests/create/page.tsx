"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { bookingRepository } from "@/lib/mock/bookings";
import type { Booking, BookingChangeRequest } from "@/types/booking";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function CreateChangeRequestPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const { user } = useSession();

  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [pendingRequest, setPendingRequest] = useState<BookingChangeRequest | undefined>(undefined);

  // Form state
  const [requestType, setRequestType] = useState<"MODIFICATION" | "CANCELLATION">("MODIFICATION");
  const [proposedSchedule, setProposedSchedule] = useState("");
  const [proposedDestination, setProposedDestination] = useState("");
  const [requestedChanges, setRequestedChanges] = useState("");
  const [reason, setReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const loadData = () => {
      const b = bookingRepository.getBookingById(bookingId);
      if (b) {
        setBooking({ ...b });
        const existingPending = bookingRepository.getPendingChangeRequest(b.id);
        setPendingRequest(existingPending);
        setProposedSchedule((prev) => (prev ? prev : b.scheduleDisplay || b.schedule));
        setProposedDestination((prev) => (prev ? prev : b.destination));
      } else {
        setBooking(null);
      }
    };

    loadData();
    const unsubscribe = bookingRepository.subscribe(loadData);
    return () => unsubscribe();
  }, [bookingId]);

  if (booking === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading booking context...</div>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (pendingRequest) {
      setErrorMessage(
        "A change or cancellation request is already pending for this booking. Duplicate pending requests cannot be created.",
      );
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("Please enter an operational reason for this request.");
      return;
    }

    if (requestType === "MODIFICATION" && !requestedChanges.trim()) {
      setErrorMessage("Please specify the requested modification details.");
      return;
    }

    setIsSubmitting(true);
    try {
      bookingRepository.createChangeRequest({
        bookingId: booking.id,
        type: requestType,
        reason: reason.trim(),
        requestedChanges:
          requestType === "MODIFICATION"
            ? requestedChanges.trim()
            : `Cancellation requested: ${reason.trim()}`,
        proposedSchedule: requestType === "MODIFICATION" ? proposedSchedule.trim() : undefined,
        proposedDestination:
          requestType === "MODIFICATION" ? proposedDestination.trim() : undefined,
        submittedByRole: user?.role || "Concierge",
      });

      setSuccessMessage(
        `${requestType === "MODIFICATION" ? "Modification" : "Cancellation"} request created successfully on behalf of customer.`,
      );

      setTimeout(() => {
        router.push(`/bookings/${booking.id}/change-requests`);
      }, 700);
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while creating the request.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1140px] w-full"
        data-node-id="81:708"
        data-name="CC-BKG-06__Concierge_/_Admin_/_Super_Admin__Ready"
      >
        {/* Breadcrumb Navigation */}
        <div className="mb-[16px]">
          <Link
            href={`/bookings/${booking.id}`}
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Booking ({booking.reference})
          </Link>
        </div>

        {/* Header with Title and Scope */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="81:748"
            >
              Create Change / Cancellation Request on Behalf
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-BKG-06 (Node 81:708) · Scoped to Concierge / Admin / Super Admin
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F1EFEA] border border-[#DDD8CF] rounded-full text-xs font-semibold text-[#0B0C0E] self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#164D53]" />
            Concierge / Admin / Super Admin
          </div>
        </div>

        {/* Success / Error Alerts */}
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
          {/* Card 1: Booking Context */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="81:750"
          >
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-[16px]">
              Booking context
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Reference
                </span>
                <span className="block text-[15px] font-bold text-[#0B0C0E] mt-1">
                  {booking.reference}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-[#F1EFEA] text-[#0B0C0E]">
                  Status: {booking.lifecycleStatus} (v{booking.version})
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Customer / trip
                </span>
                <span className="block text-[15px] font-semibold text-[#0B0C0E] mt-1">
                  {booking.customerName}
                </span>
                <span className="block text-[13px] text-[#5B616B] mt-0.5">
                  {booking.tripId ? `Trip: ${booking.tripId}` : "Individual booking"}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Service & Schedule
                </span>
                <span className="block text-[15px] font-semibold text-[#0B0C0E] mt-1">
                  {booking.serviceName}
                </span>
                <span className="block text-[13px] text-[#5B616B] mt-0.5">
                  {booking.scheduleDisplay}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Destination
                </span>
                <span className="block text-[15px] font-semibold text-[#0B0C0E] mt-1">
                  {booking.destination}
                </span>
                <span className="block text-[13px] text-[#5B616B] mt-0.5">
                  {booking.currency} {booking.priceAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Request Guard Notice */}
          {pendingRequest ? (
            <div
              className="bg-[#FEF3C7] border-2 border-[#F59E0B] rounded-[12px] p-[24px]"
              data-node-id="81:754"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold text-lg shrink-0">
                  !
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-[#92400E]">
                    Pending-request guard active
                  </h3>
                  <p className="text-[14px] text-[#78350F] mt-1">
                    An existing supported request is still <strong>PENDING_ADMIN</strong>. In
                    accordance with XTREME operational integrity policy, duplicate pending change
                    requests cannot be created while one is open.
                  </p>

                  <div className="mt-4 p-4 bg-white/80 border border-[#FCD34D] rounded-[8px] space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#78350F]">Request ID:</span>
                      <span className="font-mono text-[#0B0C0E]">{pendingRequest.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#78350F]">Request Type:</span>
                      <span className="font-bold text-[#0B0C0E]">{pendingRequest.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#78350F]">Submitted:</span>
                      <span className="text-[#0B0C0E]">{pendingRequest.createdDisplay}</span>
                    </div>
                    <div className="pt-2 border-t border-[#FCD34D]/60">
                      <span className="font-semibold text-[#78350F] block">Details:</span>
                      <span className="text-[#0B0C0E] mt-0.5 block">
                        {pendingRequest.requestedChanges}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <Link
                      href={`/bookings/${booking.id}/change-requests`}
                      className="inline-flex items-center px-4 py-2.5 bg-[#92400E] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#78350F] transition-colors"
                    >
                      Review & Resolve Pending Request →
                    </Link>
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="inline-flex items-center px-4 py-2.5 bg-white border border-[#DDD8CF] text-[13px] font-semibold text-[#0B0C0E] rounded-[8px] hover:bg-[#F9F8F6] transition-colors"
                    >
                      Cancel & Return
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Card 2: Create Request Form */
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card space-y-[24px]"
            >
              <div>
                <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px]">
                  Request Details
                </h2>
                <p className="text-[13px] text-[#5B616B] mt-1">
                  Specify whether you are filing a schedule/destination modification or full booking
                  cancellation on behalf of {booking.customerName}.
                </p>
              </div>

              {/* Request Type Selector */}
              <div>
                <span className="block text-[14px] font-semibold text-[#0B0C0E] mb-2">
                  Request Type <span className="text-[#DC2626]">*</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[500px]">
                  <label
                    htmlFor="req-type-mod"
                    className={`flex items-center gap-3 p-4 border rounded-[10px] cursor-pointer transition-colors ${
                      requestType === "MODIFICATION"
                        ? "border-[#0B0C0E] bg-[#F1EFEA]"
                        : "border-[#DDD8CF] bg-white hover:bg-[#FAF8F4]"
                    }`}
                  >
                    <input
                      id="req-type-mod"
                      type="radio"
                      name="requestType"
                      value="MODIFICATION"
                      checked={requestType === "MODIFICATION"}
                      onChange={() => setRequestType("MODIFICATION")}
                      className="w-4 h-4 text-[#0B0C0E] focus:ring-0"
                    />
                    <div>
                      <span className="block text-[14px] font-bold text-[#0B0C0E]">
                        MODIFICATION
                      </span>
                      <span className="block text-[12px] text-[#5B616B]">
                        Change schedule, destination, or parameters
                      </span>
                    </div>
                  </label>

                  <label
                    htmlFor="req-type-cancel"
                    className={`flex items-center gap-3 p-4 border rounded-[10px] cursor-pointer transition-colors ${
                      requestType === "CANCELLATION"
                        ? "border-[#0B0C0E] bg-[#F1EFEA]"
                        : "border-[#DDD8CF] bg-white hover:bg-[#FAF8F4]"
                    }`}
                  >
                    <input
                      id="req-type-cancel"
                      type="radio"
                      name="requestType"
                      value="CANCELLATION"
                      checked={requestType === "CANCELLATION"}
                      onChange={() => setRequestType("CANCELLATION")}
                      className="w-4 h-4 text-[#0B0C0E] focus:ring-0"
                    />
                    <div>
                      <span className="block text-[14px] font-bold text-[#0B0C0E]">
                        CANCELLATION
                      </span>
                      <span className="block text-[12px] text-[#5B616B]">
                        Cancel operational booking assignment
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conditional Fields for MODIFICATION */}
              {requestType === "MODIFICATION" && (
                <div className="space-y-4 pt-2 border-t border-[#DDD8CF]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="bkg-prop-sched"
                        className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
                      >
                        Proposed Schedule
                      </label>
                      <input
                        id="bkg-prop-sched"
                        type="text"
                        value={proposedSchedule}
                        onChange={(e) => setProposedSchedule(e.target.value)}
                        placeholder="e.g. Nov 24, 2026 · 14:00 EST"
                        className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                      />
                      <p className="text-[12px] text-[#5B616B] mt-1">
                        Preserve service-local timezone context
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="bkg-prop-dest"
                        className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
                      >
                        Proposed Destination
                      </label>
                      <input
                        id="bkg-prop-dest"
                        type="text"
                        value={proposedDestination}
                        onChange={(e) => setProposedDestination(e.target.value)}
                        placeholder="e.g. Newark EWR Airport"
                        className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                      />
                      <p className="text-[12px] text-[#5B616B] mt-1">
                        Updated drop-off, venue, or flight route
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bkg-req-changes"
                      className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
                    >
                      Requested Changes & Specifications <span className="text-[#DC2626]">*</span>
                    </label>
                    <textarea
                      id="bkg-req-changes"
                      rows={3}
                      value={requestedChanges}
                      onChange={(e) => setRequestedChanges(e.target.value)}
                      placeholder="Specify passenger changes, flight timing adjustment, or special requests..."
                      className="w-full p-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    />
                  </div>
                </div>
              )}

              {/* Reason Field */}
              <div>
                <label
                  htmlFor="bkg-op-reason"
                  className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
                >
                  Operational Reason for{" "}
                  {requestType === "MODIFICATION" ? "Change" : "Cancellation"}{" "}
                  <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="bkg-op-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    requestType === "MODIFICATION"
                      ? "e.g. Flight delay requested by customer via VIP phone line"
                      : "e.g. Customer cancelled trip due to scheduling conflict"
                  }
                  className="w-full p-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                />
              </div>

              {/* Policy Callout */}
              <div className="p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[8px] text-[12px] text-[#5B616B] space-y-1">
                <p className="font-semibold text-[#0B0C0E]">Domain Policy Notice:</p>
                <p>
                  • Submitting this request creates an authoritative pending request requiring Admin
                  / Super Admin review.
                </p>
                <p>
                  • Cancellation of a booking does <strong>NOT</strong> automatically issue a
                  payment refund. Payment reconciliation and refunding is handled independently via
                  the Payment Detail management screen.
                </p>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-[#DDD8CF]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-[48px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
                <Link
                  href={`/bookings/${booking.id}`}
                  className="h-[48px] px-[24px] bg-white border border-[#A6A19A] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] transition-colors inline-flex items-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </CommandCenterShell>
  );
}
