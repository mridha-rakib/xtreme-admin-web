"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { bookingRepository } from "@/lib/mock/bookings";
import type { Booking, BookingChangeRequest } from "@/types/booking";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";

export default function BookingChangeRequestsPage() {
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [requests, setRequests] = useState<BookingChangeRequest[]>([]);

  useEffect(() => {
    if (!bookingId) return;

    const loadData = () => {
      const b = bookingRepository.getBookingById(bookingId);
      if (b) {
        setBooking(b);
        const crs = bookingRepository.listChangeRequests(b.id);
        setRequests(crs);
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
        <div className="p-[32px] text-sm text-[#5B616B]">Loading change requests...</div>
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

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1140px] w-full"
        data-node-id="81:542"
        data-name="CC-BKG-04__Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href={`/bookings/${booking.id}`}
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Booking Detail ({booking.reference})
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="81:580"
            >
              Booking Change Requests
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Context: {booking.reference} · v{booking.version} · {booking.customerName}
            </p>
          </div>
          <Link
            href={`/bookings/${booking.id}/change-requests/create`}
            className="h-[44px] px-[18px] bg-[#0B0C0E] text-white text-[13px] font-semibold rounded-[10px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors self-start md:self-auto"
          >
            + Create Request on Behalf
          </Link>
        </div>

        {/* Change Requests Table */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card"
          data-node-id="81:584"
        >
          {/* Table Header */}
          <div className="bg-[#EEE9E0] h-[52px] px-[20px] flex items-center text-[13px] font-semibold text-[#5B616B] tracking-[0.15px] border-b border-[#DDD8CF]">
            <div className="w-[140px] shrink-0">Type</div>
            <div className="flex-1 min-w-[200px] pr-4">Requested changes</div>
            <div className="w-[150px] shrink-0">Vendor decision</div>
            <div className="w-[150px] shrink-0">Status</div>
            <div className="w-[130px] shrink-0">Created</div>
            <div className="w-[120px] shrink-0 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#DDD8CF]">
            {requests.length === 0 ? (
              <div className="py-[48px] text-center text-[#5B616B] text-[14px]">
                No change requests exist for this booking record.
              </div>
            ) : (
              requests.map((req) => {
                const isPending = req.status === "PENDING_ADMIN";
                const isResolved = req.status === "RESOLVED";

                return (
                  <div
                    key={req.id}
                    className="h-[64px] px-[20px] flex items-center text-[14px] text-[#0B0C0E] hover:bg-[#FAF8F4] transition-colors"
                  >
                    {/* Type */}
                    <div className="w-[140px] shrink-0 font-semibold text-[13px]">
                      <span
                        className={`inline-flex items-center px-[8px] py-[2px] rounded-md ${
                          req.type === "MODIFICATION"
                            ? "bg-[#E0F2FE] text-[#0369A1]"
                            : "bg-[#FEE2E2] text-[#B91C1C]"
                        }`}
                      >
                        {req.type}
                      </span>
                    </div>

                    {/* Requested Changes */}
                    <div className="flex-1 min-w-[200px] pr-4 text-[13px] text-[#0B0C0E] truncate">
                      {req.requestedChanges}
                    </div>

                    {/* Vendor Decision */}
                    <div className="w-[150px] shrink-0">
                      <span
                        className={`inline-flex items-center px-[8px] py-[2px] rounded-full text-[12px] font-semibold ${
                          req.vendorDecision === "ACCEPTED"
                            ? "bg-[#E5F4E3] text-[#226E35]"
                            : req.vendorDecision === "REJECTED"
                              ? "bg-[#FEECEC] text-[#991B1B]"
                              : "bg-[#f9eccd] text-[#6c4a13]"
                        }`}
                      >
                        {req.vendorDecision}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="w-[150px] shrink-0">
                      <span
                        className={`inline-flex items-center px-[10px] py-[3px] rounded-full text-[12px] font-semibold ${
                          isPending
                            ? "bg-[#f9eccd] text-[#6c4a13]"
                            : isResolved
                              ? "bg-[#E5F4E3] text-[#226E35]"
                              : "bg-[#FEECEC] text-[#991B1B]"
                        }`}
                      >
                        {req.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Created */}
                    <div className="w-[130px] shrink-0 text-[13px] text-[#5B616B]">
                      {req.createdDisplay}
                    </div>

                    {/* Actions */}
                    <div className="w-[120px] shrink-0 text-right">
                      {isPending ? (
                        <Link
                          href={`/bookings/${booking.id}/change-requests/${req.id}/resolve`}
                          className="inline-flex items-center px-3 py-1 bg-[#0B0C0E] hover:bg-[#17191D] border border-[#B48737] rounded-md text-white text-xs font-semibold transition-colors"
                        >
                          Resolve ›
                        </Link>
                      ) : (
                        <Link
                          href={`/bookings/${booking.id}/change-requests/${req.id}/resolve`}
                          className="text-xs font-semibold text-[#164D53] hover:underline"
                        >
                          View ›
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </CommandCenterShell>
  );
}
