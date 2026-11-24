"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

export default function ModuleCatchAllPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug.join("/") : (params?.slug as string) || "";
  const moduleName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  return (
    <CommandCenterShell>
      <div className="p-[32px] max-w-[1200px] w-full">
        <div className="bg-white border border-[#DDD8CF] rounded-[16px] p-[48px] max-w-[640px] shadow-sm">
          <div className="w-[48px] h-[48px] rounded-full bg-[#FAF8F4] border border-[#DDD8CF] flex items-center justify-center font-bold text-[#A88343] mb-4">
            ★
          </div>
          <h1 className="text-[24px] font-bold text-[#0B0C0E] mb-2">{moduleName} Module</h1>
          <p className="text-[14px] text-[#5B616B] leading-[22px] mb-6">
            This operational module is part of the approved Section 05 Command Center roadmap and is
            scheduled for implementation in upcoming batch phases. Phase 4.1 scope is strictly
            limited to Batch 1 (5 of 64 approved screens).
          </p>

          <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#DDD8CF] text-xs text-[#5B616B] mb-6">
            <span className="font-semibold text-[#0B0C0E]">Current Target:</span> 5 / 64 Admin Web
            Screens (Authentication, Dashboard, and Customer Management).
          </div>

          <Link
            href="/"
            className="inline-flex items-center px-4 py-2.5 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D] transition-colors"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </CommandCenterShell>
  );
}
