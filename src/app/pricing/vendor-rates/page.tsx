"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { PricingNavigationTabs } from "@/features/pricing/PricingNavigationTabs";
import { useSession } from "@/lib/auth/session";
import { vendorRateRepository } from "@/lib/mock/vendor-rates";
import type { VendorRate, VendorRateStatus } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function VendorRatesListPage() {
  const { user } = useSession();
  const [rates, setRates] = useState<VendorRate[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadRates = () => {
      try {
        const filter =
          statusFilter !== "ALL" ? { status: statusFilter as VendorRateStatus } : undefined;
        const data = vendorRateRepository.listVendorRates(user, filter);
        setRates(data);
      } catch {
        setRates([]);
      }
    };

    loadRates();
    const unsubscribe = vendorRateRepository.subscribe(loadRates);
    return () => unsubscribe();
  }, [user, statusFilter]);

  const filteredRates = rates.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.vendorServiceName.toLowerCase().includes(q) ||
      r.vendorName.toLowerCase().includes(q) ||
      r.assetName?.toLowerCase().includes(q)
    );
  });

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="88:2783"
        data-name="CC-PRC-01__Admin__Ready"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="88:2822"
            >
              Vendor Rates List
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Configure, audit and approve vendor service cost rate schedules
            </p>
          </div>

          <Link href="/pricing/vendor-rates/submit">
            <Button
              className="h-[48px] px-6 bg-[#0B0C0E] text-white rounded-[12px] font-semibold text-sm hover:bg-[#17191D]"
              data-node-id="88:2823"
            >
              + Submit vendor rate
            </Button>
          </Link>
        </div>

        {/* Pricing Sub-navigation Tabs */}
        <PricingNavigationTabs />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search vendor service, asset, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] placeholder-[#8C8F97] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Rates Table */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card mb-4"
          data-node-id="88:2825"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE7DF] bg-[#FAF8F4]" data-node-id="88:2826">
                  <th className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]">
                    Vendor service
                  </th>
                  <th className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]">Asset</th>
                  <th className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]">Version</th>
                  <th className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]">Amount</th>
                  <th className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]">Validity</th>
                  <th className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]">Status</th>
                  <th className="py-3 px-4 text-[13px] font-semibold text-[#5B616B] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE7DF] text-sm">
                {filteredRates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#5B616B]">
                      No vendor cost rates found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRates.map((rate) => {
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
                      <tr key={rate.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-[#0B0C0E]">
                          <div>{rate.vendorServiceName}</div>
                          <div className="text-xs text-[#5B616B]">{rate.vendorName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#5B616B]">{rate.assetName || "—"}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#0B0C0E]">
                          v{rate.version}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#0B0C0E]">
                          {rate.currency} {rate.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#5B616B]">
                          {validFromStr} – {validToStr}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${statusBg}`}
                          >
                            {rate.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/pricing/vendor-rates/${rate.id}`}
                            className="text-xs font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                          >
                            Open ›
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-xs text-[#8C8F97] italic mt-2">
          PENDING is not active operational pricing. Customer-facing price/margin is not shown here.
        </p>
      </div>
    </CommandCenterShell>
  );
}
