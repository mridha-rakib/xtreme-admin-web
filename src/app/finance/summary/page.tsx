"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { FinanceNavigationTabs } from "@/features/finance/FinanceNavigationTabs";
import { useSession } from "@/lib/auth/session";
import { financialReportingService } from "@/lib/mock/financial-reporting";
import type { FinancialDateRange, FinancialSummaryMetrics } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function FinancialSummaryPage() {
  const { user } = useSession();
  const [metrics, setMetrics] = useState<FinancialSummaryMetrics | null>(null);
  const [dateRange, setDateRange] = useState<FinancialDateRange>("THIS_MONTH");
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const data = financialReportingService.getFinancialSummaryMetrics(user, dateRange);
      setMetrics(data);
      setAccessDenied(false);
    } catch {
      setAccessDenied(true);
      setMetrics(null);
    }
  }, [user, dateRange]);

  if (accessDenied || user?.role === "VENDOR") {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-[#B42318]">Access Restricted (403)</h2>
            <p className="text-sm text-[#5B616B] mt-2 max-w-lg mx-auto">
              Financial performance summaries, platform gross margins, and treasury metrics are
              confidential to Command Center administrators. Vendor partners cannot view customer
              revenue or margin reports.
            </p>
            <div className="mt-6">
              <Link href="/finance/vendor-payables">
                <Button className="bg-[#0B0C0E] text-white text-xs px-5 py-2.5 rounded-lg">
                  ← Go to My Vendor Payables
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  const dateRangeButtons: { id: FinancialDateRange; label: string }[] = [
    { id: "THIS_MONTH", label: "This Month" },
    { id: "LAST_30_DAYS", label: "Last 30 Days" },
    { id: "THIS_QUARTER", label: "This Quarter" },
    { id: "YTD", label: "Year to Date" },
    { id: "ALL_TIME", label: "All Time" },
  ];

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="90:3591"
        data-name="CC-FIN-03__FinancialSummary__Ready"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-tight leading-[36px]"
              data-node-id="90:3595"
            >
              Financial Summary
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Consolidated real-time revenue, gross margins, cash collections, and vendor payout
              obligations
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F4] border border-[#DDD8CF] p-1 rounded-xl">
            {dateRangeButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setDateRange(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  dateRange === btn.id
                    ? "bg-[#0B0C0E] text-white shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Finance Sub-navigation Tabs */}
        <FinanceNavigationTabs />

        {/* 7 Canonical Metric Cards */}
        {metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Customer Revenue */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 shadow-sm">
                <span className="text-xs font-bold text-[#5B616B] uppercase tracking-wider block">
                  1. Customer Revenue
                </span>
                <div className="text-2xl font-bold text-[#0B0C0E] mt-2">
                  {metrics.customerRevenueXof.toLocaleString()} XOF
                </div>
                <span className="text-[11px] text-[#5B616B] mt-1 block">
                  Gross customer bookings invoiced
                </span>
              </div>

              {/* 2. Vendor Cost */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 shadow-sm">
                <span className="text-xs font-bold text-[#5B616B] uppercase tracking-wider block">
                  2. Vendor Cost
                </span>
                <div className="text-2xl font-bold text-[#0B0C0E] mt-2">
                  {metrics.vendorCostXof.toLocaleString()} XOF
                </div>
                <span className="text-[11px] text-[#5B616B] mt-1 block">
                  Approved partner service cost obligations
                </span>
              </div>

              {/* 3. XTREME Gross Margin */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 shadow-sm bg-gradient-to-br from-white to-[#F0FDF4]/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5B616B] uppercase tracking-wider block">
                    3. XTREME Gross Margin
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                    {metrics.grossMarginPercentage}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#027A48] mt-2">
                  {metrics.grossMarginXof.toLocaleString()} XOF
                </div>
                <span className="text-[11px] text-[#5B616B] mt-1 block">
                  Net platform spread after vendor cost
                </span>
              </div>

              {/* 4. Payments Received */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 shadow-sm">
                <span className="text-xs font-bold text-[#5B616B] uppercase tracking-wider block">
                  4. Payments Received
                </span>
                <div className="text-2xl font-bold text-[#0B0C0E] mt-2">
                  {metrics.paymentsReceivedXof.toLocaleString()} XOF
                </div>
                <span className="text-[11px] text-[#5B616B] mt-1 block">
                  Total settled client collections
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 5. Refunds Issued */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 shadow-sm">
                <span className="text-xs font-bold text-[#5B616B] uppercase tracking-wider block">
                  5. Refunds Issued
                </span>
                <div className="text-2xl font-bold text-[#B42318] mt-2">
                  {metrics.refundsIssuedXof.toLocaleString()} XOF
                </div>
                <span className="text-[11px] text-[#5B616B] mt-1 block">
                  Operational adjustments &amp; cancellations
                </span>
              </div>

              {/* 6. Outstanding Customer Balance */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 shadow-sm">
                <span className="text-xs font-bold text-[#5B616B] uppercase tracking-wider block">
                  6. Outstanding Customer Balance
                </span>
                <div className="text-2xl font-bold text-[#B54708] mt-2">
                  {metrics.outstandingCustomerBalanceXof.toLocaleString()} XOF
                </div>
                <span className="text-[11px] text-[#5B616B] mt-1 block">
                  Uncollected client invoices due
                </span>
              </div>

              {/* 7. Vendor Amount Due */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 shadow-sm">
                <span className="text-xs font-bold text-[#5B616B] uppercase tracking-wider block">
                  7. Vendor Amount Due
                </span>
                <div className="text-2xl font-bold text-[#B54708] mt-2">
                  {metrics.vendorAmountDueXof.toLocaleString()} XOF
                </div>
                <span className="text-[11px] text-[#5B616B] mt-1 block">
                  Unsettled partner payout obligations
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Category Contribution Breakdown Table */}
        <div className="mt-8 bg-white border border-[#DDD8CF] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#DDD8CF] bg-[#FAF8F4] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B0C0E]">
              Revenue &amp; Margin Contribution by Service Category
            </h2>
            <span className="text-xs text-[#5B616B]">Denominated in canonical XOF</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#DDD8CF] text-xs font-semibold text-[#5B616B] uppercase tracking-wider bg-white">
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Active Bookings</th>
                  <th className="py-3 px-4">Customer Revenue</th>
                  <th className="py-3 px-4">Vendor Cost</th>
                  <th className="py-3 px-4">Gross Margin</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF] text-[#0B0C0E]">
                <tr className="hover:bg-[#FAF8F4] transition-colors">
                  <td className="py-3 px-4 font-semibold">Private Jet Aviation</td>
                  <td className="py-3 px-4">4</td>
                  <td className="py-3 px-4 font-medium">3,981,250 XOF</td>
                  <td className="py-3 px-4">2,315,250 XOF</td>
                  <td className="py-3 px-4 font-semibold text-[#027A48]">1,666,000 XOF</td>
                  <td className="py-3 px-4 text-right font-bold text-[#027A48]">41.8%</td>
                </tr>
                <tr className="hover:bg-[#FAF8F4] transition-colors">
                  <td className="py-3 px-4 font-semibold">Superyacht Charters</td>
                  <td className="py-3 px-4">2</td>
                  <td className="py-3 px-4 font-medium">2,143,750 XOF</td>
                  <td className="py-3 px-4">1,163,750 XOF</td>
                  <td className="py-3 px-4 font-semibold text-[#027A48]">980,000 XOF</td>
                  <td className="py-3 px-4 text-right font-bold text-[#027A48]">45.7%</td>
                </tr>
                <tr className="hover:bg-[#FAF8F4] transition-colors">
                  <td className="py-3 px-4 font-semibold">Executive Chauffeur</td>
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4 font-medium">428,750 XOF</td>
                  <td className="py-3 px-4">285,825 XOF</td>
                  <td className="py-3 px-4 font-semibold text-[#027A48]">142,925 XOF</td>
                  <td className="py-3 px-4 text-right font-bold text-[#027A48]">33.3%</td>
                </tr>
                <tr className="hover:bg-[#FAF8F4] transition-colors">
                  <td className="py-3 px-4 font-semibold">Fine Dining &amp; Private Chefs</td>
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4 font-medium">580,000 XOF</td>
                  <td className="py-3 px-4">341,100 XOF</td>
                  <td className="py-3 px-4 font-semibold text-[#027A48]">238,900 XOF</td>
                  <td className="py-3 px-4 text-right font-bold text-[#027A48]">41.2%</td>
                </tr>
                <tr className="hover:bg-[#FAF8F4] transition-colors">
                  <td className="py-3 px-4 font-semibold">Close Protection &amp; Security</td>
                  <td className="py-3 px-4">1</td>
                  <td className="py-3 px-4 font-medium">735,000 XOF</td>
                  <td className="py-3 px-4">428,750 XOF</td>
                  <td className="py-3 px-4 font-semibold text-[#027A48]">306,250 XOF</td>
                  <td className="py-3 px-4 text-right font-bold text-[#027A48]">41.7%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Treasury Notice */}
        <div className="mt-6 p-4 rounded-xl bg-[#FAF8F4] border border-[#DDD8CF] text-xs text-[#5B616B] flex items-center justify-between">
          <span>
            Canonical conversions computed using authoritative FX fixing rates (USD/XOF: 612.50,
            EUR/XOF: 655.957). Historical transaction snapshots remain immutable.
          </span>
          <Link
            href="/finance/fx-rates"
            className="font-semibold text-[#164D53] hover:underline shrink-0 ml-4"
          >
            Manage FX Rates →
          </Link>
        </div>
      </div>
    </CommandCenterShell>
  );
}
