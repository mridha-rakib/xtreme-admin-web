"use client";

import { useSession } from "@/lib/auth/session";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function FinanceNavigationTabs() {
  const pathname = usePathname();
  const { user } = useSession();

  // Vendor persona is restricted to Vendor Payables only
  if (user?.role === "VENDOR") {
    return null;
  }

  const tabs = [
    {
      id: "payables",
      label: "Vendor Payables",
      href: "/finance/vendor-payables",
      active: pathname.startsWith("/finance/vendor-payables"),
    },
    {
      id: "summary",
      label: "Financial Summary",
      href: "/finance/summary",
      active: pathname.startsWith("/finance/summary"),
    },
    {
      id: "fx-rates",
      label: "FX Rates",
      href: "/finance/fx-rates",
      active: pathname.startsWith("/finance/fx-rates"),
    },
  ];

  return (
    <div className="flex border-b border-[#DDD8CF] mb-6">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors -mb-[1px] ${
            tab.active
              ? "border-[#0B0C0E] text-[#0B0C0E]"
              : "border-transparent text-[#5B616B] hover:text-[#0B0C0E] hover:border-[#DDD8CF]"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
