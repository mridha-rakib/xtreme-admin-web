"use client";

import { useSession } from "@/lib/auth/session";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";

export function TopBar() {
  const { user, signOut } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    router.push("/auth/sign-in");
  };

  const roleLabel =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user?.role === "ADMIN"
        ? "Operations Admin"
        : user?.role === "CONCIERGE"
          ? "Concierge Team"
          : "Vendor Partner";

  return (
    <header className="h-[72px] min-h-[72px] bg-white border-b border-[#DDD8CF] px-[28px] flex items-center justify-between relative z-20">
      {/* Search / Command input */}
      <div className="relative w-[435px] h-[39px] bg-[#EEE9E0] rounded-[8px] flex items-center px-[13px]">
        <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
          <Image src="/icons/search.svg" alt="" width={16} height={16} className="opacity-60" />
        </div>
        <input
          type="search"
          placeholder="Search / command"
          className="w-full h-full bg-transparent pl-[12px] text-[14px] text-[#0B0C0E] placeholder:text-[#5B616B] focus:outline-none"
        />
      </div>

      {/* User Menu Area */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-[10px] cursor-pointer focus:outline-none p-1 rounded-md hover:bg-[#FAF8F4] transition-colors"
          aria-label="User Menu"
          aria-expanded={isMenuOpen}
        >
          <div className="w-[22px] h-[22px] flex items-center justify-center">
            <Image src="/icons/user.svg" alt="" width={20} height={20} className="opacity-75" />
          </div>
          <span className="text-[14px] font-semibold text-[#5B616B] tracking-[0.15px]">
            {roleLabel}
          </span>
          <div className="w-[16px] h-[16px] flex items-center justify-center">
            <svg
              className={`w-3.5 h-3.5 text-[#5B616B] transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-[220px] bg-white border border-[#DDD8CF] rounded-lg shadow-dropdown p-2 text-xs">
            <div className="px-3 py-2 border-b border-[#DDD8CF]">
              <p className="font-semibold text-[#0B0C0E] truncate">
                {user?.name || "Victoria Vance"}
              </p>
              <p className="text-[#5B616B] truncate">
                {user?.email || "vance@xtremeconcierge.internal"}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#A88343]">
                {user?.role || "SUPER_ADMIN"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 mt-1 rounded text-[#B42318] hover:bg-[#FEF3F2] font-semibold cursor-pointer transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
