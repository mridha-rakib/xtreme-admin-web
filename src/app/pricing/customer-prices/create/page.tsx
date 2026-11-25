"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { CreateCustomerPriceForm } from "@/features/pricing/CreateCustomerPriceForm";
import { useSession } from "@/lib/auth/session";
import Link from "next/link";
import React from "react";

export default function CreateCustomerPricePage() {
  const { user } = useSession();
  const isVendor = user?.role === "VENDOR";

  if (isVendor) {
    return (
      <CommandCenterShell>
        <div
          className="p-[32px] max-w-[1280px] w-full"
          data-node-id="88:3140"
          data-name="CC-PRC-05__Admin__Ready"
        >
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4 shadow-card max-w-[800px]">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Access Restricted</h2>
            <p className="text-sm text-[#5B616B]">
              Vendors cannot configure customer-facing selling prices or retail margins.
            </p>
            <Link
              href="/pricing/vendor-rates"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Vendor Rates
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
        data-node-id="88:3140"
        data-name="CC-PRC-05__Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <Link
            href="/pricing/customer-prices"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Customer Price Configurations
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
            data-node-id="88:3179"
          >
            Create Customer Price Configuration
          </h1>
          <p className="text-[14px] text-[#5B616B] mt-1">
            Define customer selling price rules, markup margins, and service retail schedules
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-8 shadow-card mb-4 max-w-4xl">
          <CreateCustomerPriceForm />
        </div>

        {/* Footnote */}
        <p className="text-xs text-[#8C8F97] italic mt-2" data-node-id="88:3217">
          No custom-field-driven pricing formula builder is introduced.
        </p>
      </div>
    </CommandCenterShell>
  );
}
