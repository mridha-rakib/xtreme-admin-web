"use client";

import { useSession } from "@/lib/auth/session";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface TabItem {
  id: string;
  label: string;
  href: string;
  adminOnly?: boolean;
}

const TABS: TabItem[] = [
  {
    id: "vendor-rates",
    label: "Vendor Rates",
    href: "/pricing/vendor-rates",
  },
  {
    id: "customer-prices",
    label: "Customer Prices",
    href: "/pricing/customer-prices",
    adminOnly: true,
  },
];

export function PricingNavigationTabs() {
  const pathname = usePathname();
  const { user } = useSession();

  const isVendor = user?.role === "VENDOR";
  const visibleTabs = TABS.filter((tab) => !(isVendor && tab.adminOnly));

  return (
    <div className="flex border-b border-[#EAE7DF] mb-6 space-x-8">
      {visibleTabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.id === "vendor-rates" && pathname.startsWith("/pricing/vendor-rates")) ||
          (tab.id === "customer-prices" && pathname.startsWith("/pricing/customer-prices"));

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
              isActive
                ? "border-[#0B0C0E] text-[#0B0C0E]"
                : "border-transparent text-[#5B616B] hover:text-[#0B0C0E]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
