"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { bookingRepository } from "@/lib/mock/bookings";
import { tripRepository } from "@/lib/mock/trips";
import type { Booking } from "@/types/booking";
import type { Trip } from "@/types/trip";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params?.tripId as string;

  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [linkedBookings, setLinkedBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!tripId) return;

    const loadData = () => {
      const t = tripRepository.getTripById(tripId);
      if (t) {
        setTrip({ ...t });
        // Retrieve linked bookings from bookingRepository
        const allBookings = bookingRepository.listBookings({ pageSize: 100 }).items;
        const linked = allBookings.filter(
          (b) =>
            b.tripId === t.id ||
            b.tripId === t.reference ||
            t.linkedBookingIds.includes(b.id) ||
            t.linkedBookingIds.includes(b.reference),
        );
        setLinkedBookings(linked);
      } else {
        setTrip(null);
      }
    };

    loadData();
    const unsubscribeTrip = tripRepository.subscribe(loadData);
    const unsubscribeBooking = bookingRepository.subscribe(loadData);
    return () => {
      unsubscribeTrip();
      unsubscribeBooking();
    };
  }, [tripId]);

  if (trip === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading trip details...</div>
      </CommandCenterShell>
    );
  }

  if (trip === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Trip Container Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              No trip record exists for identifier &ldquo;{tripId}&rdquo;.
            </p>
            <Link
              href="/trips"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Trips List
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]";
      case "IN_PROGRESS":
        return "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
      case "COMPLETED":
        return "bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]";
      case "CANCELLED":
        return "bg-[#FDE8E8] text-[#9B1C1C] border-[#F8B4B4]";
      default:
        return "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="83:1208"
        data-name="CC-TRIP-02__Concierge__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/trips"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Trips List
          </Link>
        </div>

        {/* Header with Title and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="83:1240"
            >
              Trip Detail
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-TRIP-02 (Node 83:1208) · Container context: {trip.reference}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/trips/${trip.id}/edit`}
              className="h-[48px] px-[20px] bg-white border border-[#A6A19A] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] inline-flex items-center justify-center transition-colors"
              data-node-id="14:14"
            >
              Edit Trip
            </Link>
            <Link
              href={`/bookings/create?tripId=${trip.id}`}
              className="h-[48px] px-[20px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors"
              data-node-id="14:2"
            >
              + Add Booking
            </Link>
          </div>
        </div>

        {/* Operational Isolation Notice */}
        <div
          className="mb-[24px] p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[10px] text-[13px] text-[#5B616B] flex items-start gap-3"
          data-node-id="83:1270"
        >
          <span className="font-bold text-[#0B0C0E] text-base leading-none">ℹ</span>
          <div>
            <p className="font-semibold text-[#0B0C0E]">Decoupled Architecture Rule</p>
            <p className="mt-0.5">
              Linked booking statuses must be re-read independently. The trip itself is not
              authoritative booking state. Adding, editing or cancelling a trip container does not
              alter linked booking operational lifecycles.
            </p>
          </div>
        </div>

        <div className="space-y-[24px]">
          {/* Card 1: Trip Metadata */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="83:1242"
          >
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px]">
                Trip metadata
              </h2>
              <span
                className={`px-3 py-1 text-[12px] font-bold rounded-full border ${getStatusBadge(
                  trip.status,
                )}`}
              >
                {trip.status.replace("_", " ")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Reference
                </span>
                <span className="block text-[16px] font-bold text-[#0B0C0E] mt-1 font-mono">
                  {trip.reference}
                </span>
                <span className="block text-[12px] text-[#5B616B] mt-0.5">ID: {trip.id}</span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Customer
                </span>
                <Link
                  href={`/customers/${trip.customerId}`}
                  className="block text-[16px] font-bold text-[#164D53] hover:underline mt-1"
                >
                  {trip.customerName}
                </Link>
                <span className="block text-[12px] text-[#5B616B] mt-0.5">
                  {trip.customerEmail}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Destination / Area
                </span>
                <span className="block text-[16px] font-semibold text-[#0B0C0E] mt-1">
                  {trip.destination}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Title
                </span>
                <span className="block text-[16px] font-semibold text-[#0B0C0E] mt-1">
                  {trip.title}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Dates (Start — End)
                </span>
                <span className="block text-[16px] font-semibold text-[#0B0C0E] mt-1">
                  {trip.datesDisplay}
                </span>
                <span className="block text-[12px] text-[#5B616B] mt-0.5">
                  {trip.startDate} to {trip.endDate}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Notes & Itinerary Context
                </span>
                <span className="block text-[14px] text-[#0B0C0E] mt-1">
                  {trip.notes || "No special notes recorded."}
                </span>
              </div>
            </div>

            {/* Linked Concierge Requests Context */}
            <div className="mt-6 pt-6 border-t border-[#DDD8CF] flex items-center justify-between">
              <div>
                <span className="text-[14px] font-semibold text-[#0B0C0E]">
                  Concierge Coordination
                </span>
                <p className="text-[12px] text-[#5B616B] mt-0.5">
                  Linked request context for this trip itinerary
                </p>
              </div>
              <Link
                href={`/concierge/requests/create?tripId=${trip.id}`}
                className="text-[13px] font-semibold text-[#164D53] hover:underline"
              >
                + Create Concierge Request ›
              </Link>
            </div>
          </div>

          {/* Card 2: Related Operational Context & Linked Bookings */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="83:1260"
          >
            <div className="flex items-center justify-between mb-[16px]">
              <div>
                <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px]">
                  Linked Bookings ({linkedBookings.length})
                </h2>
                <p className="text-[13px] text-[#5B616B] mt-0.5">
                  Bookings associated with this trip container
                </p>
              </div>

              <Link
                href={`/bookings/create?tripId=${trip.id}`}
                className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E]"
              >
                + Link New Booking
              </Link>
            </div>

            {linkedBookings.length === 0 ? (
              <div className="py-8 text-center text-[14px] text-[#5B616B] border border-dashed border-[#DDD8CF] rounded-[8px]">
                No operational bookings currently linked to this trip.
                <div className="mt-2">
                  <Link
                    href={`/bookings/create?tripId=${trip.id}`}
                    className="text-[#164D53] font-semibold hover:underline"
                  >
                    Create a booking for this trip →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-[#FAF8F4] border-b border-[#DDD8CF] text-[#5B616B] text-[12px] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Schedule</th>
                      <th className="py-3 px-4">Lifecycle Status</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD8CF]">
                    {linkedBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FAF8F4]/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B0C0E]">
                          <Link href={`/bookings/${b.id}`} className="hover:text-[#164D53]">
                            {b.reference}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-[#0B0C0E] font-medium">{b.serviceName}</td>
                        <td className="py-3.5 px-4 text-[#5B616B]">{b.scheduleDisplay}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-[#F1EFEA] text-[#0B0C0E]">
                            {b.lifecycleStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#5B616B] text-[13px]">
                          {b.paymentStatus}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/bookings/${b.id}`}
                            className="text-[#164D53] font-semibold text-[13px] hover:underline"
                          >
                            View Booking ›
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </CommandCenterShell>
  );
}
