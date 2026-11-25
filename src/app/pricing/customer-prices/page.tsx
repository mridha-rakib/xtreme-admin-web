"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { PricingNavigationTabs } from "@/features/pricing/PricingNavigationTabs";
import { useSession } from "@/lib/auth/session";
import { customerPriceRepository } from "@/lib/mock/customer-prices";
import type { CustomerPriceConfig } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function CustomerPricesListPage() {
  const { user } = useSession();
  const [prices, setPrices] = useState<CustomerPriceConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const isVendor = user?.role === "VENDOR";

  useEffect(() => {
    if (!user || isVendor) return;

    const loadPrices = () => {
      try {
        const filter = activeFilter !== "ALL" ? { active: activeFilter === "ACTIVE" } : undefined;
        const data = customerPriceRepository.listCustomerPrices(user, filter);
        setPrices(data);
      } catch {
        setPrices([]);
      }
    };

    loadPrices();
    const unsubscribe = customerPriceRepository.subscribe(loadPrices);
    return () => unsubscribe();
  }, [user, isVendor, activeFilter]);

  if (isVendor) {
    return (
      <CommandCenterShell>
        <div
          className="p-[32px] max-w-[1280px] w-full"
          data-node-id="88:3032"
          data-name="CC-PRC-04__Admin__Ready"
        >
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4 shadow-card max-w-[800px]">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Access Restricted</h2>
            <p className="text-sm text-[#5B616B]">
              Vendors cannot view or manage customer-facing price configurations or margins.
              Customer retail pricing is strictly administered by XTREME Operations.
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

  const filteredPrices = prices.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.serviceName.toLowerCase().includes(q) ||
      p.vendorServiceName?.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const handleToggleActive = (price: CustomerPriceConfig) => {
    if (!user) return;
    try {
      customerPriceRepository.toggleCustomerPriceActive(user, price.id, !price.active);
    } catch {
      // error handled by state
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="88:3032"
        data-name="CC-PRC-04__Admin__Ready"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="88:3071"
            >
              Customer Price Configurations
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Configure customer-facing selling prices, markup rules, and retail schedules
            </p>
          </div>

          <Link href="/pricing/customer-prices/create">
            <Button
              className="h-[48px] px-6 bg-[#0B0C0E] text-white rounded-[12px] font-semibold text-sm hover:bg-[#17191D]"
              data-node-id="88:3072"
            >
              + Create customer price
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
              placeholder="Search service, vendor asset, or config ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] placeholder-[#8C8F97] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="ALL">All Configurations</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Prices Table */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card mb-4"
          data-node-id="88:3074"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE7DF] bg-[#FAF8F4]" data-node-id="88:3075">
                  <th
                    className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]"
                    data-node-id="88:3076"
                  >
                    Service
                  </th>
                  <th
                    className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]"
                    data-node-id="88:3077"
                  >
                    Vendor service / Asset
                  </th>
                  <th
                    className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]"
                    data-node-id="88:3078"
                  >
                    Price mode
                  </th>
                  <th
                    className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]"
                    data-node-id="88:3079"
                  >
                    XOF amount
                  </th>
                  <th
                    className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]"
                    data-node-id="88:3080"
                  >
                    Validity
                  </th>
                  <th
                    className="py-3 px-4 text-[13px] font-semibold text-[#5B616B]"
                    data-node-id="88:3081"
                  >
                    Active
                  </th>
                  <th
                    className="py-3 px-4 text-[13px] font-semibold text-[#5B616B] text-right"
                    data-node-id="88:3082"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE7DF] text-sm">
                {filteredPrices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#5B616B]">
                      No customer price configurations found.
                    </td>
                  </tr>
                ) : (
                  filteredPrices.map((price) => {
                    const validFromStr = new Date(price.validFrom).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const validToStr = new Date(price.validTo).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <tr key={price.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-[#0B0C0E]">
                          <div>{price.serviceName}</div>
                          <div className="text-xs text-[#5B616B] capitalize">
                            {price.serviceCategory}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#5B616B]">
                          {price.vendorServiceName || "All vendor assets"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#0B0C0E]">
                          {price.priceMode}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#0B0C0E]">
                          XOF {price.xofAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#5B616B]">
                          {validFromStr} – {validToStr}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                              price.active
                                ? "bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]"
                                : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]"
                            }`}
                          >
                            {price.active ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(price)}
                            className="text-xs font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
                          >
                            {price.active ? "Deactivate" : "Activate"} ›
                          </button>
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
          XTREME controls Customer-facing selling price. Vendor/Customer cannot override XTREME
          margin or selling amount.
        </p>
      </div>
    </CommandCenterShell>
  );
}
