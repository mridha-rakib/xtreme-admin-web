"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { StaleVersionConflictError, bookingRepository } from "@/lib/mock/bookings";
import type { Booking, BookingChangeRequest } from "@/types/booking";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function ResolveChangeRequestPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const requestId = params?.requestId as string;

  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [request, setRequest] = useState<BookingChangeRequest | null | undefined>(undefined);
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reason, setReason] = useState(
    "Operationally validated and approved according to luxury fleet guidelines.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingId || !requestId) return;

    const loadData = () => {
      const b = bookingRepository.getBookingById(bookingId);
      if (b) {
        setBooking(b);
        const r = bookingRepository.getChangeRequest(b.id, requestId);
        setRequest(r || null);
      } else {
        setBooking(null);
        setRequest(null);
      }
    };

    loadData();
    const unsubscribe = bookingRepository.subscribe(loadData);
    return () => unsubscribe();
  }, [bookingId, requestId]);

  if (booking === undefined || request === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading change resolution context...</div>
      </CommandCenterShell>
    );
  }

  if (booking === null || request === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Record Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              No change request matching identifier &ldquo;{requestId}&rdquo; was found for booking
              &ldquo;{bookingId}&rdquo;.
            </p>
            <Link
              href={booking ? `/bookings/${booking.id}/change-requests` : "/bookings"}
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Change Requests
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!reason.trim()) {
      setErrorMessage("Please enter an operational resolution note or reason.");
      return;
    }

    setIsSubmitting(true);

    try {
      bookingRepository.resolveChangeRequest({
        bookingId: booking.id,
        requestId: request.id,
        expectedVersion: booking.version,
        decision,
        reason: reason.trim(),
        resolvedByRole: "SUPER_ADMIN",
      });

      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      if (err instanceof StaleVersionConflictError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An error occurred during change resolution.");
      }
      setIsSubmitting(false);
    }
  };

  const isAlreadyResolved = request.status !== "PENDING_ADMIN";

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1140px] w-full"
        data-node-id="81:642"
        data-name="CC-BKG-05__Admin_/_Super_Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href={`/bookings/${booking.id}/change-requests`}
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Change Requests ({booking.reference})
          </Link>
        </div>

        {/* Header */}
        <div className="mb-[24px]">
          <h1
            className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
            data-node-id="81:676"
          >
            Resolve Booking Change / Cancellation
          </h1>
          <p className="text-[14px] text-[#5B616B] mt-[4px]">
            Authoritative Review & Decision Console · {booking.reference} · v{booking.version}
          </p>
        </div>

        {/* Error / Conflict Alert */}
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
              Reload Latest Authoritative Record
            </button>
          </div>
        )}

        {isAlreadyResolved && (
          <div className="mb-[20px] p-[16px] bg-[#E0F2FE] border border-[#BAE6FD] rounded-[10px] text-[14px] text-[#0369A1]">
            This request has already been resolved with status: <strong>{request.status}</strong> by{" "}
            {request.resolution?.resolvedBy || "Admin"}.
          </div>
        )}

        <form onSubmit={handleResolve} noValidate className="space-y-[24px]">
          {/* Card: Current Change Request Overview */}
          <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card space-y-[16px]">
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] pb-[12px] border-b border-[#DDD8CF]">
              Current change request
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
              {/* Request Type */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] text-[13px] font-semibold text-[#5B616B] border-b border-[#ded6c9]">
                  Request type
                </div>
                <div className="p-[12px] font-semibold text-[14px] text-[#0B0C0E]">
                  {request.type}
                </div>
              </div>

              {/* Booking Version */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] text-[13px] font-semibold text-[#5B616B] border-b border-[#ded6c9]">
                  Booking version
                </div>
                <div className="p-[12px] font-mono text-[14px] text-[#0B0C0E]">
                  Current authoritative version (v{booking.version})
                </div>
              </div>

              {/* Vendor Confirmation */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] text-[13px] font-semibold text-[#5B616B] border-b border-[#ded6c9]">
                  Vendor confirmation
                </div>
                <div className="p-[12px] text-[14px] font-semibold text-[#226E35]">
                  {request.vendorDecision} {request.vendorNotes ? `· ${request.vendorNotes}` : ""}
                </div>
              </div>
            </div>

            {/* Requested changes summary */}
            <div className="p-[16px] bg-[#FAF8F4] border border-[#DDD8CF] rounded-[8px]">
              <span className="text-[13px] font-semibold text-[#5B616B] block mb-[4px]">
                Requested changes:
              </span>
              <p className="text-[14px] text-[#0B0C0E]">{request.requestedChanges}</p>
            </div>
          </div>

          {/* Card: Decision & Notes */}
          <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card space-y-[20px]">
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] pb-[12px] border-b border-[#DDD8CF]">
              Decision
            </h2>

            {/* Decision Radio/Select */}
            <div className="space-y-[8px]">
              <span className="block text-[13px] font-semibold text-[#5B616B]">
                Resolution decision
              </span>
              <div className="flex items-center gap-[24px]">
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVE"
                    checked={decision === "APPROVE"}
                    onChange={() => setDecision("APPROVE")}
                    disabled={isAlreadyResolved}
                    className="w-4 h-4 text-[#A88343] focus:ring-[#A88343]"
                  />
                  <span className="text-[14px] font-medium text-[#0B0C0E]">Approve request</span>
                </label>

                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="REJECT"
                    checked={decision === "REJECT"}
                    onChange={() => setDecision("REJECT")}
                    disabled={isAlreadyResolved}
                    className="w-4 h-4 text-[#A88343] focus:ring-[#A88343]"
                  />
                  <span className="text-[14px] font-medium text-[#0B0C0E]">Reject request</span>
                </label>
              </div>
            </div>

            {/* Resolution Note */}
            <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
              <div className="bg-[#f4eddf] px-[12px] py-[6px] text-[13px] font-semibold text-[#5B616B] border-b border-[#ded6c9]">
                Resolution note
              </div>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isAlreadyResolved}
                className="w-full p-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-[16px]">
            <button
              type="submit"
              disabled={isSubmitting || isAlreadyResolved}
              className="h-[48px] px-[24px] bg-[#0B0C0E] hover:bg-[#17191D] border-[1.2px] border-[#B48737] rounded-[12px] text-white text-[14px] font-semibold flex items-center justify-center transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              data-node-id="81:684"
            >
              {isSubmitting ? "Processing..." : "Approve / reject"}
            </button>

            <Link
              href={`/bookings/${booking.id}/change-requests`}
              className="h-[48px] px-[24px] bg-white hover:bg-[#FAF8F4] border border-[#A6A19A] rounded-[12px] text-[#0B0C0E] text-[14px] font-semibold flex items-center justify-center transition-colors cursor-pointer"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Resolution Rule Card */}
        <div
          className="mt-[28px] bg-[#f1e7d3] border border-[#ddd8cf] rounded-[12px] p-[20px] relative overflow-hidden shadow-xs"
          data-node-id="81:692"
        >
          <h3 className="text-[18px] font-semibold text-[#0B0C0E] mb-[6px]">Resolution rule</h3>
          <p className="text-[14px] font-normal leading-[22px] text-[#5B616B]">
            Approved modification revalidates availability/pricing atomically. Approved cancellation
            releases allocations but does not automatically calculate or trigger a refund.
          </p>
        </div>
      </div>
    </CommandCenterShell>
  );
}
