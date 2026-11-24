"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { vendorRepository } from "@/lib/mock/vendors";
import type { VendorOrganization } from "@/types/vendor";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params?.vendorId as string;

  const [vendor, setVendor] = useState<VendorOrganization | null | undefined>(undefined);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) return;

    const loadData = () => {
      const v = vendorRepository.getVendorById(vendorId);
      setVendor(v || null);
    };

    loadData();
    const unsubscribe = vendorRepository.subscribe(loadData);
    return () => unsubscribe();
  }, [vendorId]);

  if (vendor === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading vendor detail...</div>
      </CommandCenterShell>
    );
  }

  if (vendor === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4 shadow-card">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Vendor Organization Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              No partner vendor organization record exists for identifier &ldquo;{vendorId}&rdquo;.
            </p>
            <Link
              href="/vendors"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Vendors List
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="86:1779"
        data-name="CC-VEN-02__Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/vendors"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Vendors
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="86:1818"
            >
              Vendor Detail
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-VEN-02 (Node 86:1779) · Organization: {vendor.displayName} ({vendor.id})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/vendors/${vendor.id}/edit`}
              className="h-[48px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors"
              data-node-id="14:2"
            >
              Edit vendor
            </Link>
          </div>
        </div>

        {/* Scope Guard Notice if future module clicked */}
        {activeNotice && (
          <div className="mb-[24px] p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] text-[#1E40AF] text-[13px] flex items-center justify-between">
            <span>{activeNotice}</span>
            <button
              type="button"
              onClick={() => setActiveNotice(null)}
              className="text-[#1E40AF] font-bold text-sm ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Two Column Grid for Cards 1 & 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-[24px]">
          {/* Card 1: Vendor Organization Details (col-span-7) */}
          <div
            className="lg:col-span-7 bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="86:1819"
          >
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-6">
              Vendor organization
            </h2>

            <div className="space-y-4 text-[14px]">
              <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-[#FAF8F4]">
                <span className="w-[170px] text-[13px] font-semibold text-[#5B616B] shrink-0">
                  Display name
                </span>
                <span className="text-[#0B0C0E] font-medium">{vendor.displayName}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-[#FAF8F4]">
                <span className="w-[170px] text-[13px] font-semibold text-[#5B616B] shrink-0">
                  Legal name
                </span>
                <span className="text-[#0B0C0E]">{vendor.legalName || "—"}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-[#FAF8F4]">
                <span className="w-[170px] text-[13px] font-semibold text-[#5B616B] shrink-0">
                  Status
                </span>
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                      vendor.status === "ACTIVE"
                        ? "bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]"
                        : vendor.status === "MAINTENANCE"
                          ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                          : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]"
                    }`}
                  >
                    {vendor.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-[#FAF8F4]">
                <span className="w-[170px] text-[13px] font-semibold text-[#5B616B] shrink-0">
                  Email
                </span>
                <span className="text-[#0B0C0E]">{vendor.contactEmail || "—"}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center py-2">
                <span className="w-[170px] text-[13px] font-semibold text-[#5B616B] shrink-0">
                  Phone
                </span>
                <span className="text-[#0B0C0E]">{vendor.contactPhone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Operational Links (col-span-5) */}
          <div
            className="lg:col-span-5 bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="86:1831"
          >
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-6">
              Operational links
            </h2>

            <div className="space-y-4">
              {/* Bookings */}
              <div className="flex items-center justify-between py-2 border-b border-[#FAF8F4]">
                <span className="text-[14px] text-[#0B0C0E] font-medium">Bookings</span>
                <Link
                  href="/bookings"
                  className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                >
                  Open ›
                </Link>
              </div>

              {/* Assets */}
              <div className="flex items-center justify-between py-2 border-b border-[#FAF8F4]">
                <span className="text-[14px] text-[#0B0C0E] font-medium">Assets</span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveNotice(
                      "Vendor Asset Management is scheduled for Phase 4.6 (future scope).",
                    )
                  }
                  className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                >
                  Open ›
                </button>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between py-2 border-b border-[#FAF8F4]">
                <span className="text-[14px] text-[#0B0C0E] font-medium">Availability</span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveNotice(
                      "Vendor Availability Calendar is scheduled for Phase 4.7 (future scope).",
                    )
                  }
                  className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                >
                  Open ›
                </button>
              </div>

              {/* Vendor rates */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] text-[#0B0C0E] font-medium">Vendor rates</span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveNotice(
                      "Vendor Rate Matrix & Pricing is scheduled for Phase 4.8 (future scope).",
                    )
                  }
                  className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                >
                  Open ›
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: UI-API-01 Reconciliation Notice */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
          data-node-id="86:1843"
        >
          <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-2">
            UI-API-01 reconciliation
          </h2>
          <p className="text-[14px] text-[#5B616B] leading-[22px]">
            This detail may use a selected list record. Stable direct reload/deep link remains
            implementation-dependent until a dedicated Vendor detail read contract is reconciled; no
            GET detail API is invented.
          </p>
        </div>
      </div>
    </CommandCenterShell>
  );
}
