"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface TabItem {
  name: string;
  href: string;
  description: string;
}

const TABS: TabItem[] = [
  {
    name: "Availability Rules",
    href: "/availability",
    description: "Recurring schedules & capacity windows",
  },
  {
    name: "Availability Exceptions",
    href: "/availability/exceptions",
    description: "Overrides & blackout periods",
  },
  {
    name: "Availability Slots",
    href: "/availability/slots",
    description: "Discrete bookable interval units",
  },
];

export function AvailabilityNavigationTabs() {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === "/availability") {
      return pathname === "/availability" || pathname?.startsWith("/availability/rules");
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex items-center gap-2 border-b border-[#DDD8CF] mb-6">
      {TABS.map((tab) => {
        const active = isTabActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-colors -mb-[1px] ${
              active
                ? "border-[#0B0C0E] text-[#0B0C0E]"
                : "border-transparent text-[#5B616B] hover:text-[#0B0C0E] hover:border-[#DDD8CF]"
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
