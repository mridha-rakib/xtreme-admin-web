"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { AvailabilityNavigationTabs } from "@/features/availability/AvailabilityNavigationTabs";
import { useSession } from "@/lib/auth/session";
import { availabilitySlotRepository } from "@/lib/mock/availability-slots";
import type { AvailabilitySlot, AvailabilitySlotStatus } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AvailabilitySlotsPage() {
  const { user } = useSession();

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AvailabilitySlotStatus | "ALL">("ALL");

  useEffect(() => {
    if (!user) return;

    const loadSlots = () => {
      try {
        const vendorId = user.role === "VENDOR" ? user.vendorId : undefined;
        const filtered = availabilitySlotRepository.listSlots(user, {
          vendorId,
          status: statusFilter,
          search,
        });
        setSlots(filtered);
      } catch {
        setSlots([]);
      }
    };

    loadSlots();
    const unsubscribe = availabilitySlotRepository.subscribe(loadSlots);
    return () => unsubscribe();
  }, [user, search, statusFilter]);

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="88:2610"
        data-name="CC-AVL-05__Admin__Ready"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="88:2649"
            >
              Availability Slots
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Discrete Bookable Fleet Operational Units &amp; Duty Windows
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/availability/slots/create"
              className="h-[48px] min-w-[240px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors shadow-sm"
              data-node-id="88:2650"
            >
              + Create Slot
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <AvailabilityNavigationTabs />

        {/* Filters */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-4 shadow-card mb-[20px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px] max-w-[480px] relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search slots by target asset or notes..."
              className="w-full h-[40px] pl-3.5 pr-8 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-[#5B616B] hover:text-[#0B0C0E] text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#5B616B] font-medium">Status:</span>
            <div className="inline-flex rounded-[8px] border border-[#DDD8CF] p-0.5 bg-[#FAF8F4]">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("OPEN")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  statusFilter === "OPEN"
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("CLOSED")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  statusFilter === "CLOSED"
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                Closed
              </button>
            </div>
          </div>
        </div>

        {/* Slots Table (Figma Node 88:2652) */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card mb-[16px]"
          data-node-id="88:2652"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="bg-[#EEE9E0] border-b border-[#DDD8CF] text-[#5B616B] text-[13px] font-semibold"
                  data-node-id="88:2653"
                >
                  <th className="py-3.5 px-6" data-node-id="88:2654">
                    Target
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2655">
                    Starts
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2656">
                    Ends
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2657">
                    Capacity
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2658">
                    Status
                  </th>
                  <th className="py-3.5 px-6 text-right" data-node-id="88:2659">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF]">
                {slots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#5B616B] text-[14px]">
                      No availability slots configured.
                    </td>
                  </tr>
                ) : (
                  slots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#0B0C0E] text-[14px]">
                        <div>{slot.target}</div>
                        {slot.notes && (
                          <div className="text-[12px] text-[#5B616B] font-normal mt-0.5">
                            {slot.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#0B0C0E]">
                        {slot.startsDisplay || slot.startsAt}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#0B0C0E]">
                        {slot.endsDisplay || slot.endsAt}
                      </td>
                      <td className="py-4 px-6 text-[14px] font-medium text-[#0B0C0E]">
                        {slot.capacity} pax
                      </td>
                      <td className="py-4 px-6 text-[14px]">
                        {slot.status === "OPEN" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#EDFDF5] text-[#03543F] border border-[#BCF0DA]">
                            OPEN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                            CLOSED
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/availability/slots/${slot.id}/edit`}
                          className="text-[#164D53] hover:text-[#0B0C0E] font-semibold text-[14px] inline-flex items-center gap-1"
                        >
                          Open ›
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footnote (Figma Node 88:2709) */}
        <p className="text-[12px] text-[#5B616B]" data-node-id="88:2709">
          Slot status is OPEN/CLOSED. Closing a slot rejects new allocations but does not cancel
          confirmed bookings.
        </p>
      </div>
    </CommandCenterShell>
  );
}
