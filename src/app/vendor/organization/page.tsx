"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { vendorRepository } from "@/lib/mock/vendors";
import type { VendorOrganization } from "@/types/vendor";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function MyVendorOrganizationPage() {
  const { user } = useSession();

  const [vendor, setVendor] = useState<VendorOrganization | null | undefined>(undefined);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  // Resolve vendor organization server-side/session-based
  useEffect(() => {
    if (!user) {
      setVendor(undefined);
      return;
    }

    try {
      const v = vendorRepository.getAuthenticatedVendor(user);
      setVendor(v || null);
    } catch {
      setVendor(null);
    }
  }, [user]);

  if (vendor === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">
          Loading authenticated vendor organization...
        </div>
      </CommandCenterShell>
    );
  }

  if (vendor === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4 shadow-card">
            <h2 className="text-xl font-bold text-[#0B0C0E]">No Organization Membership</h2>
            <p className="text-sm text-[#5B616B]">
              Your authenticated session is not associated with an authorized partner vendor
              organization.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Command Center Home
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
        data-node-id="86:1917"
        data-name="CC-VEN-04__Vendor__Ready"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="86:1956"
            >
              My Vendor Organization
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Authenticated Partner: {vendor.displayName}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F1EFEA] border border-[#DDD8CF] rounded-full text-xs font-semibold text-[#0B0C0E]">
            <span className="w-2 h-2 rounded-full bg-[#164D53]" />
            Resolved Org: {vendor.id}
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

        {/* Two Column Grid for Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-[24px]">
          {/* Card 1: Own Organization Details (col-span-7) */}
          <div
            className="lg:col-span-7 bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="86:1957"
          >
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-6">
              Own organization
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

          {/* Card 2: Own Workspace Links (col-span-5) */}
          <div
            className="lg:col-span-5 bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="86:1969"
          >
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-6">
              Own workspace
            </h2>

            <div className="space-y-4">
              {/* Vendor Staff */}
              <div className="flex items-center justify-between py-2 border-b border-[#FAF8F4]">
                <span className="text-[14px] text-[#0B0C0E] font-medium">Vendor Staff</span>
                <Link
                  href="/vendor/staff"
                  className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                >
                  Open ›
                </Link>
              </div>

              {/* Assets */}
              <div className="flex items-center justify-between py-2 border-b border-[#FAF8F4]">
                <span className="text-[14px] text-[#0B0C0E] font-medium">Assets</span>
                <Link
                  href="/assets"
                  className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                >
                  Open ›
                </Link>
              </div>

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

              {/* Availability */}
              <div className="flex items-center justify-between py-2 border-b border-[#FAF8F4]">
                <span className="text-[14px] text-[#0B0C0E] font-medium">Availability</span>
                <Link
                  href="/availability"
                  className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                >
                  Open ›
                </Link>
              </div>

              {/* Rates */}
              <div className="flex items-center justify-between py-2 border-b border-[#FAF8F4]">
                <span className="text-[14px] text-[#0B0C0E] font-medium">Rates</span>
                <Link
                  href="/pricing/vendor-rates"
                  className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                >
                  Open ›
                </Link>
              </div>

              {/* Payables */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] text-[#0B0C0E] font-medium">Payables</span>
                <Link
                  href="/finance/vendor-payables"
                  className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                >
                  Open ›
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Button */}
        <div className="mb-[16px]">
          <button
            type="button"
            onClick={() =>
              setActiveNotice(
                "Vendor Partner Agreements, Terms & Legal documents are accessible under Support & Legal.",
              )
            }
            className="h-[48px] px-[20px] bg-transparent text-[#0B0C0E] border border-[#DDD8CF] hover:bg-[#FAF8F4] text-[14px] font-semibold rounded-[12px] inline-flex items-center justify-center transition-colors"
            data-node-id="14:26"
          >
            Vendor Terms / Support &amp; Legal
          </button>
        </div>

        {/* Server-Side Scope Footnote */}
        <p className="text-[12px] text-[#5B616B]" data-node-id="86:1985">
          Authenticated Vendor organization is resolved server-side. No free vendor_id switcher is
          exposed.
        </p>
      </div>
    </CommandCenterShell>
  );
}
