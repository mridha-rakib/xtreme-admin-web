"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { FinanceNavigationTabs } from "@/features/finance/FinanceNavigationTabs";
import { useSession } from "@/lib/auth/session";
import { vendorPayableRepository } from "@/lib/mock/vendor-payables";
import type { PayableStatus, VendorPayable } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function VendorPayablesListPage() {
  const { user } = useSession();
  const [payables, setPayables] = useState<VendorPayable[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadPayables = () => {
      try {
        const filters = {
          status: statusFilter !== "ALL" ? (statusFilter as PayableStatus) : undefined,
          vendorId: vendorFilter !== "ALL" ? vendorFilter : undefined,
          search: searchQuery.trim() || undefined,
        };
        const data = vendorPayableRepository.listPayables(user, filters);
        setPayables(data);
      } catch {
        setPayables([]);
      }
    };

    loadPayables();
    const unsubscribe = vendorPayableRepository.subscribe(loadPayables);
    return () => unsubscribe();
  }, [user, statusFilter, vendorFilter, searchQuery]);

  const totalDue = payables.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = payables.reduce((sum, p) => sum + p.amountPaid, 0);
  const pendingDisbursements = Math.max(0, totalDue - totalPaid);

  const getStatusBadge = (status: PayableStatus) => {
    switch (status) {
      case "PAID":
        return "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]";
      case "PROCESSING":
        return "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]";
      case "PENDING":
        return "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]";
      case "ON_HOLD":
        return "bg-[#F9F5FF] text-[#6941C6] border-[#E9D7FE]";
      case "FAILED":
        return "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]";
      default:
        return "bg-[#F2F4F7] text-[#344054] border-[#D0D5DD]";
    }
  };

  const isVendor = user?.role === "VENDOR";

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="90:3405"
        data-name="CC-FIN-01__VendorPayables__Ready"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="90:3410"
            >
              Vendor Payables
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              {isVendor
                ? "View your organization's payout disbursements and settlement records"
                : "Track, audit, and reconcile vendor service payout obligations and disbursement status"}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF8F4] border border-[#DDD8CF] text-xs font-medium text-[#5B616B]">
            <span className="w-2 h-2 rounded-full bg-[#164D53]" />
            Manual payout tracking only · Automated disbursement disabled
          </div>
        </div>

        {/* Finance Sub-navigation Tabs */}
        <FinanceNavigationTabs />

        {/* UI-API-02 Notice for Admins */}
        {!isVendor && (
          <div className="mb-6 p-4 rounded-xl bg-[#EFF8FF] border border-[#B2DDFF] flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#175CD3] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              i
            </div>
            <div className="text-sm text-[#1E40AF]">
              <div className="font-semibold text-[#1E3A8A]">
                UI-API-02 Reconciliation Notice: Administrative Payable Directory Scope
              </div>
              <p className="mt-0.5 text-[#1E40AF] leading-relaxed">
                Command Center Vendor Payables displays verified vendor disbursement obligations.
                Full cross-vendor administrative ledger browsing and automated bank settlement are
                pending backend accounting ledger reconciliation. Individual vendor accounts and
                known payable records can be audited below.
              </p>
            </div>
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider">
              Total Obligation Due
            </span>
            <div className="text-2xl font-bold text-[#0B0C0E] mt-1">
              ${totalDue.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#5B616B] mt-0.5 block">
              Cumulative agreed vendor costs
            </span>
          </div>

          <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider">
              Disbursed to Date
            </span>
            <div className="text-2xl font-bold text-[#027A48] mt-1">
              ${totalPaid.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#5B616B] mt-0.5 block">
              Verified corporate wire transfers
            </span>
          </div>

          <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider">
              Pending Disbursement
            </span>
            <div className="text-2xl font-bold text-[#B54708] mt-1">
              ${pendingDisbursements.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#5B616B] mt-0.5 block">
              Awaiting close-out or verification
            </span>
          </div>

          <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider">
              Total Payables
            </span>
            <div className="text-2xl font-bold text-[#0B0C0E] mt-1">{payables.length}</div>
            <span className="text-[11px] text-[#5B616B] mt-0.5 block">Active ledger entries</span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search booking reference, service, or payout reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] placeholder-[#8C8F97] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>

          <div className="w-full sm:w-[180px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="PAID">PAID</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {!isVendor && (
            <div className="w-full sm:w-[220px]">
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Vendors</option>
                <option value="vnd_005">Monaco Chauffeur Prestige</option>
                <option value="vnd_riviera_02">Riviera Luxury Estates &amp; Villas</option>
                <option value="vnd_azure_01">Côte d'Azur Marine</option>
                <option value="vnd_aerojet_99">AeroJet Aviation Partners</option>
              </select>
            </div>
          )}
        </div>

        {/* Payables Table */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#DDD8CF] bg-[#FAF8F4] text-[#5B616B] text-[12px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Booking</th>
                  <th className="py-3 px-4">Vendor Partner</th>
                  <th className="py-3 px-4">Amount Due</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payout Ref</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF] text-[#0B0C0E]">
                {payables.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#5B616B]">
                      No vendor payables found matching current filters.
                    </td>
                  </tr>
                ) : (
                  payables.map((payable) => (
                    <tr key={payable.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0B0C0E]">
                          {payable.bookingReference}
                        </div>
                        <div className="text-xs text-[#5B616B]">{payable.serviceName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-xs text-[#0B0C0E]">
                        {payable.vendorName}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-sm">
                        {payable.currency} {payable.amountDue.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-sm text-[#027A48]">
                        {payable.currency} {payable.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(payable.status)}`}
                        >
                          {payable.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-[#5B616B]">
                        {payable.payoutReference || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5B616B]">
                        {new Date(payable.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/finance/vendor-payables/${payable.id}`}>
                          <Button
                            variant="secondary"
                            className="h-[32px] px-3 text-xs font-semibold border border-[#DDD8CF] rounded-md hover:bg-[#FAF8F4]"
                          >
                            {isVendor ? "View Details" : "View / Update"}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-xs text-[#8C8F97] flex items-center justify-between">
          <span>
            {isVendor
              ? "Vendor organization view. Internal customer prices and margins are not visible."
              : "Command Center administrative ledger view. Reconciled against booking lifecycle."}
          </span>
          <span>Showing {payables.length} payables</span>
        </div>
      </div>
    </CommandCenterShell>
  );
}
