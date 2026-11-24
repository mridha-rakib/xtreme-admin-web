"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

interface WorkQueueItem {
  reference: string;
  context: "Booking" | "Concierge Request" | "Assignment";
  status: "In Progress" | "New" | "Confirmed" | "Open" | "Completed";
  statusColor: "warning" | "info" | "success" | "neutral";
  updated: string;
  assigned: string;
  roleScope: Array<"SUPER_ADMIN" | "ADMIN" | "CONCIERGE" | "VENDOR">;
}

const WORK_QUEUE_DATA: WorkQueueItem[] = [
  {
    reference: "RES-10482",
    context: "Booking",
    status: "In Progress",
    statusColor: "warning",
    updated: "Jan 27, 2025 10:24 AM",
    assigned: "Concierge Team",
    roleScope: ["SUPER_ADMIN", "ADMIN", "CONCIERGE", "VENDOR"],
  },
  {
    reference: "REQ-56921",
    context: "Concierge Request",
    status: "New",
    statusColor: "info",
    updated: "Jan 27, 2025 9:58 AM",
    assigned: "Guest Services",
    roleScope: ["SUPER_ADMIN", "ADMIN", "CONCIERGE"],
  },
  {
    reference: "ASN-33015",
    context: "Assignment",
    status: "In Progress",
    statusColor: "warning",
    updated: "Jan 27, 2025 9:36 AM",
    assigned: "Ops Dispatch",
    roleScope: ["SUPER_ADMIN", "ADMIN", "CONCIERGE", "VENDOR"],
  },
  {
    reference: "RES-10479",
    context: "Booking",
    status: "Confirmed",
    statusColor: "success",
    updated: "Jan 27, 2025 8:50 AM",
    assigned: "Lead Concierge",
    roleScope: ["SUPER_ADMIN", "ADMIN", "CONCIERGE", "VENDOR"],
  },
  {
    reference: "REQ-56910",
    context: "Concierge Request",
    status: "Open",
    statusColor: "info",
    updated: "Jan 27, 2025 8:15 AM",
    assigned: "Concierge Team",
    roleScope: ["SUPER_ADMIN", "ADMIN", "CONCIERGE"],
  },
  {
    reference: "ASN-33011",
    context: "Assignment",
    status: "Completed",
    statusColor: "neutral",
    updated: "Jan 27, 2025 7:40 AM",
    assigned: "Aviation Ops",
    roleScope: ["SUPER_ADMIN", "ADMIN", "VENDOR"],
  },
];

export default function SuperAdminDashboardPage() {
  const { user } = useSession();
  const [selectedItem, setSelectedItem] = useState<WorkQueueItem | null>(null);

  const currentRole = user?.role || "SUPER_ADMIN";
  const visibleQueue = WORK_QUEUE_DATA.filter((item) => item.roleScope.includes(currentRole));

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1200px] w-full"
        data-node-id="77:26"
        data-name="CC-HOME-01__Super_Admin__Ready"
      >
        {/* Header Titles */}
        <div className="mb-[32px]">
          <h1
            className="text-[31px] font-bold leading-[38px] text-[#0B0C0E]"
            data-node-id="1126:6878"
          >
            Role-Based Home
          </h1>
          <p
            className="text-[20px] font-normal leading-[28px] text-[#0B0C0E] mt-[4px]"
            data-node-id="1126:6879"
          >
            Role-aware work queue
          </p>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[36px]">
          {/* Card 1: Bookings */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] h-[124px] p-[20px] flex items-center gap-[16px] shadow-sm"
            data-node-id="1126:6880"
            data-name="KPI / Role-scoped bookings"
          >
            <div className="w-[35px] h-[35px] shrink-0 flex items-center justify-center">
              <Image src="/figma-assets/imgVectorIconCalendar1.svg" alt="" width={35} height={35} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#0B0C0E] leading-[18px]">
                Role-scoped bookings
              </p>
              <p className="text-[28px] font-bold text-[#0B0C0E] leading-[34px] my-[2px]">24</p>
              <p className="text-[13px] font-normal text-[#5B616B] leading-[16px]">
                Accessible items only
              </p>
            </div>
          </div>

          {/* Card 2: Assignments */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] h-[124px] p-[20px] flex items-center gap-[16px] shadow-sm"
            data-node-id="1126:6887"
            data-name="KPI / Assignments / work"
          >
            <div className="w-[35px] h-[35px] shrink-0 flex items-center justify-center">
              <Image src="/figma-assets/imgVectorIconLayers1.svg" alt="" width={35} height={35} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#0B0C0E] leading-[18px]">
                Assignments / work
              </p>
              <p className="text-[28px] font-bold text-[#0B0C0E] leading-[34px] my-[2px]">17</p>
              <p className="text-[13px] font-normal text-[#5B616B] leading-[16px]">
                Accessible items only
              </p>
            </div>
          </div>

          {/* Card 3: Concierge */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] h-[124px] p-[20px] flex items-center gap-[16px] shadow-sm"
            data-node-id="1126:6893"
            data-name="KPI / Concierge / requests"
          >
            <div className="w-[35px] h-[35px] shrink-0 flex items-center justify-center">
              <Image src="/figma-assets/imgVectorIconBell.svg" alt="" width={35} height={35} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#0B0C0E] leading-[18px]">
                Concierge / requests
              </p>
              <p className="text-[28px] font-bold text-[#0B0C0E] leading-[34px] my-[2px]">38</p>
              <p className="text-[13px] font-normal text-[#5B616B] leading-[16px]">
                Accessible items only
              </p>
            </div>
          </div>

          {/* Card 4: Role-specific items */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] h-[124px] p-[20px] flex items-center gap-[16px] shadow-sm"
            data-node-id="1126:6900"
            data-name="KPI / Role-specific items"
          >
            <div className="w-[35px] h-[35px] shrink-0 flex items-center justify-center">
              <Image src="/figma-assets/imgVectorIconBolt.svg" alt="" width={35} height={35} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#0B0C0E] leading-[18px]">
                Role-specific items
              </p>
              <p className="text-[28px] font-bold text-[#0B0C0E] leading-[34px] my-[2px]">9</p>
              <p className="text-[13px] font-normal text-[#5B616B] leading-[16px]">
                Accessible items only
              </p>
            </div>
          </div>
        </div>

        {/* Work Queue Table Container */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-sm">
          {/* Table Header Row */}
          <div
            className="h-[52px] bg-[#EEE9E0] px-[20px] flex items-center text-[14px] font-semibold text-[#0B0C0E]"
            data-node-id="1126:6905"
            data-name="Table header"
          >
            <div className="w-[180px]">Reference</div>
            <div className="w-[200px]">Context</div>
            <div className="w-[160px]">Status</div>
            <div className="w-[220px]">Updated</div>
            <div className="flex-1">Assigned</div>
            <div className="w-[100px] text-right">Actions</div>
          </div>

          {/* Table Body Rows */}
          <div className="divide-y divide-[#DDD8CF]/60">
            {visibleQueue.length === 0 ? (
              <div className="py-[32px] text-center text-[14px] text-[#5B616B]">
                No operational items assigned to your current role view.
              </div>
            ) : (
              visibleQueue.map((item) => {
                const statusStyles = {
                  warning: "bg-[#FFF8E1] text-[#B26A00] border-[#FFE082]",
                  info: "bg-[#E0F2FE] text-[#184E77] border-[#BAE6FD]",
                  success: "bg-[#E8F5E9] text-[#0E7047] border-[#A5D6A7]",
                  neutral: "bg-[#F4F0E8] text-[#5B616B] border-[#DDD8CF]",
                };

                return (
                  <div
                    key={item.reference}
                    className="h-[56px] px-[20px] flex items-center text-[14px] hover:bg-[#FAF8F4] transition-colors"
                  >
                    <div className="w-[180px] font-medium text-[#0B0C0E]">{item.reference}</div>
                    <div className="w-[200px] text-[#5B616B]">{item.context}</div>
                    <div className="w-[160px]">
                      <span
                        className={`inline-flex px-[8px] py-[2px] rounded-full text-[12px] font-semibold border ${statusStyles[item.statusColor]}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="w-[220px] text-[#5B616B] text-[13px]">{item.updated}</div>
                    <div className="flex-1 text-[#0B0C0E] font-medium text-[13px]">
                      {item.assigned}
                    </div>
                    <div className="w-[100px] text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="text-[#164D53] hover:text-[#0B0C0E] font-semibold text-[13px] cursor-pointer inline-flex items-center gap-1"
                      >
                        View ›
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Operational Preview Modal for Queue View Action */}
        {selectedItem && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          >
            <div className="w-full max-w-md bg-white border border-[#DDD8CF] rounded-xl shadow-modal p-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDD8CF]">
                <h3 className="text-base font-bold text-[#0B0C0E]">
                  {selectedItem.reference} — {selectedItem.context}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-[#5B616B] hover:text-[#0B0C0E] text-sm p-1 cursor-pointer"
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <span className="text-[#5B616B] block">Status:</span>
                  <span className="font-semibold text-[#0B0C0E]">{selectedItem.status}</span>
                </div>
                <div>
                  <span className="text-[#5B616B] block">Assigned Unit:</span>
                  <span className="font-semibold text-[#0B0C0E]">{selectedItem.assigned}</span>
                </div>
                <div>
                  <span className="text-[#5B616B] block">Last Operational Timestamp:</span>
                  <span className="font-semibold text-[#0B0C0E]">{selectedItem.updated}</span>
                </div>
                <p className="text-[11px] text-[#5B616B] bg-[#FAF8F4] p-3 rounded border border-[#DDD8CF] mt-2">
                  This work item is linked to the {selectedItem.context} pipeline. Full batch screen
                  will activate in Phase 4.2.
                </p>
              </div>

              <div className="pt-3 border-t border-[#DDD8CF] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CommandCenterShell>
  );
}
