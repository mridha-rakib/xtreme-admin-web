"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { ServiceForm } from "@/features/catalog/ServiceForm";
import Link from "next/link";
import React from "react";

export default function CreateServicePage() {
  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1000px] w-full"
        data-node-id="90:4006"
        data-name="CC-CAT-04__CreateService__Ready"
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#5B616B] mb-4">
          <Link href="/catalog" className="hover:underline">
            Catalog
          </Link>
          <span>/</span>
          <Link href="/catalog/services" className="hover:underline">
            Services
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#0B0C0E]">Create Service</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-[28px] font-bold text-[#0B0C0E] tracking-tight leading-[36px]"
            data-node-id="90:4010"
          >
            Create New Service
          </h1>
          <p className="text-[14px] text-[#5B616B] mt-[4px]">
            Define a luxury service offering, configure execution templates, and establish booking
            rules
          </p>
        </div>

        <ServiceForm isEdit={false} />
      </div>
    </CommandCenterShell>
  );
}
