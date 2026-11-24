"use client";

import { IconButton } from "@/components/ui/IconButton";
import { useSession } from "@/lib/auth/session";
import Image from "next/image";
import React from "react";
import { RoleSwitcher } from "./RoleSwitcher";

export function TopBar() {
  const { user } = useSession();

  return (
    <header className="h-[72px] min-h-[72px] border-b border-brand-line bg-surface-card px-6 flex items-center justify-between">
      {/* Search Input Box */}
      <div className="flex items-center gap-2 w-72">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none opacity-60">
            <Image src="/icons/search.svg" alt="" width={14} height={14} />
          </span>
          <input
            type="search"
            placeholder="Search records, guests, flights..."
            className="w-full h-9 pl-8 pr-3 text-xs bg-surface-subtle/70 border border-brand-line/80 rounded-md text-brand-onyx placeholder:text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-surface-card transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Persona Switcher for Development & QA */}
        <RoleSwitcher />

        <div className="h-5 w-px bg-brand-line hidden sm:block" />

        {/* Notifications */}
        <IconButton aria-label="Notifications" variant="ghost" size="sm">
          <Image src="/icons/bell.svg" alt="" width={16} height={16} className="opacity-70" />
        </IconButton>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-brand-onyx text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.name ? user.name.charAt(0) : "U"}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-brand-onyx leading-tight">{user?.name}</p>
            <p className="text-[10px] text-brand-slate leading-tight">
              {user?.department || user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
