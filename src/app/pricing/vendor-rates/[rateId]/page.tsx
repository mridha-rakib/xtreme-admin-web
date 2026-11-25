"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth/session";
import { vendorRateRepository } from "@/lib/mock/vendor-rates";
import type { VendorRate } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function VendorRateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rateId = params?.rateId as string;
  const { user } = useSession();

  const [rate, setRate] = useState<VendorRate | null | undefined>(undefined);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isVendor = user?.role === "VENDOR";

  useEffect(() => {
    if (!rateId || !user) {
      if (!user) setRate(undefined);
      return;
    }

    const loadRate = () => {
      try {
        const r = vendorRateRepository.getVendorRateById(user, rateId);
        setRate(r || null);
      } catch {
        setRate(null);
      }
    };

    loadRate();
    const unsubscribe = vendorRateRepository.subscribe(loadRate);
    return () => unsubscribe();
  }, [rateId, user]);

  if (rate === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading vendor rate details...</div>
      </CommandCenterShell>
    );
  }

  if (rate === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4 shadow-card">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Vendor Rate Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              No cost rate record exists for identifier &ldquo;{rateId}&rdquo; or you lack
              authorization to inspect it.
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

  const handleApprove = () => {
    if (!user) return;
    setError(null);
    setIsProcessing(true);
    try {
      vendorRateRepository.approveVendorRate(user, rate.id, rate.version);
      setSuccessNotice(`Rate ${rate.id} has been successfully approved.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve rate.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    if (!user) return;
    if (!rejectionReason.trim()) {
      setError("Please provide a reason or note when rejecting a rate.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      vendorRateRepository.rejectVendorRate(user, rate.id, rate.version, rejectionReason.trim());
      setSuccessNotice(`Rate ${rate.id} has been marked REJECTED.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject rate.");
    } finally {
      setIsProcessing(false);
    }
  };

  const statusBg =
    rate.status === "APPROVED"
      ? "bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]"
      : rate.status === "PENDING"
        ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
        : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";

  const validFromStr = new Date(rate.validFrom).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const validToStr = new Date(rate.validTo).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="88:2891"
        data-name="CC-PRC-02__Admin__Ready"
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
                data-node-id="88:2930"
              >
                Vendor Rate Detail / Approval
              </h1>
              <span
                className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${statusBg}`}
                data-node-id="88:2931"
              >
                {rate.status}
              </span>
            </div>
            <p className="text-[14px] text-[#5B616B] mt-1">
              Rate schedule ID: {rate.id} · Organization: {rate.vendorName} ({rate.vendorId})
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {successNotice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
            {successNotice}
          </div>
        )}

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6">
          {/* Left Column: Rate Version (col-span-7) */}
          <div
            className="lg:col-span-7 bg-white border border-[#DDD8CF] rounded-[12px] p-6 shadow-card"
            data-node-id="88:2934"
          >
            <h2
              className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-6"
              data-node-id="88:2935"
            >
              Rate version
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-[#FAF8F4]">
                <span
                  className="w-[180px] text-[13px] font-semibold text-[#5B616B] shrink-0"
                  data-node-id="88:2936"
                >
                  Vendor service
                </span>
                <span className="text-[#0B0C0E] font-medium" data-node-id="88:2937">
                  {rate.vendorServiceName}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-[#FAF8F4]">
                <span
                  className="w-[180px] text-[13px] font-semibold text-[#5B616B] shrink-0"
                  data-node-id="88:2938"
                >
                  Asset
                </span>
                <span className="text-[#0B0C0E]" data-node-id="88:2939">
                  {rate.assetName || "None (Vendor-wide service)"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-[#FAF8F4]">
                <span
                  className="w-[180px] text-[13px] font-semibold text-[#5B616B] shrink-0"
                  data-node-id="88:2940"
                >
                  Version
                </span>
                <span className="text-[#0B0C0E] font-mono" data-node-id="88:2941">
                  v{rate.version}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-[#FAF8F4]">
                <span
                  className="w-[180px] text-[13px] font-semibold text-[#5B616B] shrink-0"
                  data-node-id="88:2942"
                >
                  Amount
                </span>
                <span className="text-[#0B0C0E] font-semibold" data-node-id="88:2943">
                  {rate.currency} {rate.amount.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center py-2.5">
                <span
                  className="w-[180px] text-[13px] font-semibold text-[#5B616B] shrink-0"
                  data-node-id="88:2944"
                >
                  Validity
                </span>
                <span className="text-[#0B0C0E]" data-node-id="88:2945">
                  {validFromStr} – {validToStr}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Decision (col-span-5) */}
          <div
            className="lg:col-span-5 bg-white border border-[#DDD8CF] rounded-[12px] p-6 shadow-card"
            data-node-id="88:2946"
          >
            <h2
              className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-4"
              data-node-id="88:2947"
            >
              Decision
            </h2>

            {isAdmin ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="decision-notes"
                    className="block text-xs font-semibold text-[#5B616B] mb-1.5"
                  >
                    Decision notes / Rejection reason
                  </label>
                  <textarea
                    id="decision-notes"
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter approval conditions or justification for rejection..."
                    className="w-full p-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E] resize-none"
                    data-node-id="88:2948"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing || rate.status === "APPROVED"}
                    className="flex-1 h-[48px] bg-[#0B0C0E] text-white rounded-[12px] font-semibold text-sm hover:bg-[#17191D] disabled:opacity-50"
                    data-node-id="88:2953"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleReject}
                    disabled={isProcessing || rate.status === "REJECTED"}
                    className="flex-1 h-[48px] border border-[#DDD8CF] text-[#0B0C0E] rounded-[12px] font-semibold text-sm hover:bg-[#FAF8F4] disabled:opacity-50"
                    data-node-id="88:2955"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[#FAF8F4] border border-[#EAE7DF] rounded-lg text-sm text-[#5B616B]">
                  {rate.status === "PENDING" &&
                    "This rate is pending administrator review and approval."}
                  {rate.status === "APPROVED" &&
                    "This rate has been approved by the Command Center administration."}
                  {rate.status === "REJECTED" &&
                    "This rate was rejected by the Command Center administration."}
                </div>

                <p className="text-xs text-[#8C8F97] italic" data-node-id="88:2957">
                  Vendor may view own rate but cannot approve/reject it.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footnote */}
        <p className="text-xs text-[#8C8F97] italic mt-2">
          Vendor may view own rate but cannot approve/reject it.
        </p>
      </div>
    </CommandCenterShell>
  );
}
