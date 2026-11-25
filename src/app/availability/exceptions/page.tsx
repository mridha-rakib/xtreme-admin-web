"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { AvailabilityNavigationTabs } from "@/features/availability/AvailabilityNavigationTabs";
import { useSession } from "@/lib/auth/session";
import { availabilityExceptionRepository } from "@/lib/mock/availability-exceptions";
import type { AvailabilityException, AvailabilityExceptionType } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AvailabilityExceptionsPage() {
  const { user } = useSession();

  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AvailabilityExceptionType | "ALL">("ALL");

  useEffect(() => {
    if (!user) return;

    const loadExceptions = () => {
      try {
        const vendorId = user.role === "VENDOR" ? user.vendorId : undefined;
        const filtered = availabilityExceptionRepository.listExceptions(user, {
          vendorId,
          type: typeFilter,
          search,
        });
        setExceptions(filtered);
      } catch {
        setExceptions([]);
      }
    };

    loadExceptions();
    const unsubscribe = availabilityExceptionRepository.subscribe(loadExceptions);
    return () => unsubscribe();
  }, [user, search, typeFilter]);

  const renderTypeBadge = (type: AvailabilityExceptionType) => {
    switch (type) {
      case "UNAVAILABLE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
            UNAVAILABLE
          </span>
        );
      case "AVAILABLE_OVERRIDE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
            AVAILABLE_OVERRIDE
          </span>
        );
      case "CAPACITY_OVERRIDE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEF6EE] text-[#B93815] border border-[#F9DBAF]">
            CAPACITY_OVERRIDE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-gray-100 text-gray-800">
            {type}
          </span>
        );
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="88:2424"
        data-name="CC-AVL-03__Admin__Ready"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="88:2463"
            >
              Availability Exceptions
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Specific Blackouts, Overrides, and Capacity Adjustments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/availability/exceptions/create"
              className="h-[48px] min-w-[240px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors shadow-sm"
              data-node-id="88:2464"
            >
              + Create Exception
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
              placeholder="Search exceptions by target asset or reason..."
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
            <span className="text-[13px] text-[#5B616B] font-medium">Type:</span>
            <div className="inline-flex rounded-[8px] border border-[#DDD8CF] p-0.5 bg-[#FAF8F4]">
              <button
                type="button"
                onClick={() => setTypeFilter("ALL")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  typeFilter === "ALL"
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("UNAVAILABLE")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  typeFilter === "UNAVAILABLE"
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                Unavailable
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("AVAILABLE_OVERRIDE")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  typeFilter === "AVAILABLE_OVERRIDE"
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                Available Override
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("CAPACITY_OVERRIDE")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  typeFilter === "CAPACITY_OVERRIDE"
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                Capacity Override
              </button>
            </div>
          </div>
        </div>

        {/* Exceptions Table (Figma Node 88:2466) */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card mb-[16px]"
          data-node-id="88:2466"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="bg-[#EEE9E0] border-b border-[#DDD8CF] text-[#5B616B] text-[13px] font-semibold"
                  data-node-id="88:2467"
                >
                  <th className="py-3.5 px-6" data-node-id="88:2468">
                    Target
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2469">
                    Starts
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2470">
                    Ends
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2471">
                    Type
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2472">
                    Capacity override
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2473">
                    Reason
                  </th>
                  <th className="py-3.5 px-6 text-right" data-node-id="88:2474">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF]">
                {exceptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5B616B] text-[14px]">
                      No availability exceptions found.
                    </td>
                  </tr>
                ) : (
                  exceptions.map((ex) => (
                    <tr key={ex.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#0B0C0E] text-[14px]">
                        {ex.target}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#0B0C0E]">
                        {ex.startsDisplay || ex.startsAt}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#0B0C0E]">
                        {ex.endsDisplay || ex.endsAt}
                      </td>
                      <td className="py-4 px-6 text-[14px]">{renderTypeBadge(ex.type)}</td>
                      <td className="py-4 px-6 text-[14px] text-[#0B0C0E]">
                        {ex.capacityOverride !== undefined ? `${ex.capacityOverride} pax` : "—"}
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#5B616B] max-w-[280px] truncate">
                        {ex.reason}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/availability/exceptions/${ex.id}/edit`}
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

        {/* Footnote (Figma Node 88:2531) */}
        <p className="text-[12px] text-[#5B616B]" data-node-id="88:2531">
          Exception types are UNAVAILABLE, AVAILABLE_OVERRIDE, CAPACITY_OVERRIDE. Existing confirmed
          commitments remain.
        </p>
      </div>
    </CommandCenterShell>
  );
}
