"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { VendorStaffForm } from "@/features/vendors/VendorStaffForm";
import { useSession } from "@/lib/auth/session";
import { UnauthorizedStaffAccessError, vendorStaffRepository } from "@/lib/mock/vendor-staff";
import type { VendorStaff } from "@/types/vendor";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditVendorStaffPage() {
  const params = useParams();
  const staffId = typeof params?.staffId === "string" ? params.staffId : "";
  const { user } = useSession();

  const [staff, setStaff] = useState<VendorStaff | null | undefined>(undefined);
  const [unauthorizedError, setUnauthorizedError] = useState<string | null>(null);

  useEffect(() => {
    if (!staffId || !user) {
      if (!user) setStaff(undefined);
      else setStaff(null);
      return;
    }

    const loadStaff = () => {
      try {
        setUnauthorizedError(null);
        const found = vendorStaffRepository.getStaffById(user, staffId);
        setStaff(found || null);
      } catch (err) {
        if (err instanceof UnauthorizedStaffAccessError) {
          setUnauthorizedError(err.message);
          setStaff(null);
        } else {
          setStaff(null);
        }
      }
    };

    loadStaff();
    const unsubscribe = vendorStaffRepository.subscribe(loadStaff);
    return () => unsubscribe();
  }, [staffId, user]);

  if (unauthorizedError) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-[800px] mx-auto text-center">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 space-y-4 shadow-card">
            <h2 className="text-xl font-bold text-[#DC2626]">Unauthorized Staff Access</h2>
            <p className="text-sm text-[#5B616B]">{unauthorizedError}</p>
            <Link
              href="/vendor/staff"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Vendor Staff
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  if (staff === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-8 text-center text-[#5B616B] text-[14px]">
          Loading vendor staff member...
        </div>
      </CommandCenterShell>
    );
  }

  if (staff === null) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-[800px] mx-auto text-center">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 space-y-4 shadow-card">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Staff Member Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              Vendor staff member with ID &quot;{staffId}&quot; was not found in your organization
              scope.
            </p>
            <Link
              href="/vendor/staff"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Vendor Staff
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  return <VendorStaffForm initialData={staff} mode="edit" staffId={staffId} />;
}
