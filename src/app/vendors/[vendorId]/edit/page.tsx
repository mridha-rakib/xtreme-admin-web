"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { VendorForm } from "@/features/vendors/VendorForm";
import { vendorRepository } from "@/lib/mock/vendors";
import type { VendorOrganization } from "@/types/vendor";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditVendorPage() {
  const params = useParams();
  const vendorId = params?.vendorId as string;

  const [vendor, setVendor] = useState<VendorOrganization | null | undefined>(undefined);

  useEffect(() => {
    if (!vendorId) return;

    const v = vendorRepository.getVendorById(vendorId);
    setVendor(v || null);
  }, [vendorId]);

  if (vendor === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading vendor data...</div>
      </CommandCenterShell>
    );
  }

  if (vendor === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4 shadow-card">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Vendor Organization Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              Cannot edit vendor with identifier &ldquo;{vendorId}&rdquo; because it does not exist.
            </p>
            <Link
              href="/vendors"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Vendors List
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  return <VendorForm mode="edit" vendorId={vendorId} initialData={vendor} />;
}
