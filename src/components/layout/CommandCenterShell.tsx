"use client";

import { Sidebar } from "@/components/navigation/Sidebar";
import { TopBar } from "@/components/navigation/TopBar";
import type React from "react";

export function CommandCenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F4]">
      {/* 240px Authority Rail */}
      <Sidebar />

      {/* Main Operations Canvas */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#FAF8F4]">{children}</main>
      </div>
    </div>
  );
}
