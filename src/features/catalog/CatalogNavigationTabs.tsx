"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function CatalogNavigationTabs() {
  const pathname = usePathname();

  const isServicesActive = pathname.startsWith("/catalog/services");
  const isCategoriesActive = !isServicesActive && pathname.startsWith("/catalog");

  return (
    <div className="flex items-center gap-2 border-b border-[#DDD8CF] mb-6">
      <Link
        href="/catalog"
        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
          isCategoriesActive
            ? "border-[#0B0C0E] text-[#0B0C0E]"
            : "border-transparent text-[#5B616B] hover:text-[#0B0C0E]"
        }`}
      >
        Categories &amp; Subcategories
      </Link>
      <Link
        href="/catalog/services"
        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
          isServicesActive
            ? "border-[#0B0C0E] text-[#0B0C0E]"
            : "border-transparent text-[#5B616B] hover:text-[#0B0C0E]"
        }`}
      >
        Services &amp; Templates
      </Link>
    </div>
  );
}
