"use client";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { useSession } from "@/lib/auth/session";
import { getVisibleNavItems } from "@/lib/permissions";
import { usePathname } from "next/navigation";
import React from "react";
import { NavigationItem } from "./NavigationItem";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useSession();
  const visibleItems = getVisibleNavItems(user?.role);

  const mainGroup = visibleItems.filter((item) => item.section === "main");
  const managementGroup = visibleItems.filter((item) => item.section === "management");
  const systemGroup = visibleItems.filter((item) => item.section === "system");

  return (
    <aside
      className="w-60 min-w-[240px] max-w-[240px] bg-brand-onyx text-white flex flex-col h-screen border-r border-brand-carbon select-none"
      aria-label="Admin Command Center Sidebar"
    >
      {/* Brand Header */}
      <div className="h-[72px] px-5 flex items-center border-b border-brand-carbon">
        <BrandLogo variant="dark" height={26} />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {mainGroup.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-brand-slate/80">
              Operations
            </p>
            {mainGroup.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                isActive={
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                }
              />
            ))}
          </div>
        )}

        {managementGroup.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-brand-slate/80">
              Management
            </p>
            {managementGroup.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                isActive={pathname === item.href || pathname.startsWith(item.href)}
              />
            ))}
          </div>
        )}

        {systemGroup.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-brand-slate/80">
              Governance
            </p>
            {systemGroup.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                isActive={pathname === item.href || pathname.startsWith(item.href)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Operational Persona Footer */}
      <div className="p-3 border-t border-brand-carbon bg-brand-carbon/30">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
          <div className="w-7 h-7 rounded-full bg-brand-accent/40 text-brand-gold flex items-center justify-center font-bold text-xs border border-brand-accent/60">
            {user?.name ? user.name.charAt(0) : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || "Anonymous"}</p>
            <p className="text-[10px] text-brand-slate truncate">{user?.role || "GUEST"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
