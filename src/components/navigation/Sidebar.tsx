"use client";

import { useSession } from "@/lib/auth/session";
import { getVisibleNavItems } from "@/lib/permissions";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React from "react";
import { NavigationItem } from "./NavigationItem";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();
  const visibleItems = getVisibleNavItems(user?.role);

  return (
    <aside
      className="w-[240px] min-w-[240px] max-w-[240px] bg-[#0B0C0E] text-white flex flex-col h-screen select-none border-r border-[#17191D]"
      aria-label="Command Center Rail"
    >
      {/* Brand Logo */}
      <div className="h-[104px] pt-[16px] px-[16px] shrink-0">
        <div className="w-[208px] h-[88px] rounded-[10px] overflow-hidden relative flex items-center justify-center">
          <Image
            src="/branding/logo-sidebar-dark.png"
            alt="XTREME Concierge"
            width={208}
            height={88}
            priority
            className="object-contain"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-[16px] py-[6px] space-y-[7px]">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href)) ||
            (item.id === "vendors" &&
              (pathname.startsWith("/vendor/") || pathname.startsWith("/vendors")));
          return <NavigationItem key={item.id} item={item} isActive={isActive} />;
        })}
      </nav>

      {/* Footer Role Indicator */}
      <div className="h-[48px] px-[24px] pb-[16px] flex items-center shrink-0">
        <p className="text-[12px] font-medium tracking-[0.1px] text-white/60">
          {user?.role === "SUPER_ADMIN"
            ? "Admin"
            : user?.role === "ADMIN"
              ? "Admin"
              : user?.role === "CONCIERGE"
                ? "Concierge"
                : "Vendor"}
        </p>
      </div>
    </aside>
  );
}
