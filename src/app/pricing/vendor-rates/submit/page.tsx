"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { SubmitVendorRateForm } from "@/features/pricing/SubmitVendorRateForm";
import Link from "next/link";
import React from "react";

export default function SubmitVendorRatePage() {
  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="88:2960"
        data-name="CC-PRC-03__Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <Link
            href="/pricing/vendor-rates"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Vendor Rates
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
            data-node-id="88:2999"
          >
            Submit Vendor Rate
          </h1>
          <p className="text-[14px] text-[#5B616B] mt-1">
            Submit a new cost rate schedule for partner service fulfillment
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-8 shadow-card mb-4 max-w-4xl">
          <SubmitVendorRateForm />
        </div>

        {/* Footnote */}
        <p className="text-xs text-[#8C8F97] italic mt-2" data-node-id="88:3031">
          Submission creates a PENDING version and is not active until authorized approval.
        </p>
      </div>
    </CommandCenterShell>
  );
}
