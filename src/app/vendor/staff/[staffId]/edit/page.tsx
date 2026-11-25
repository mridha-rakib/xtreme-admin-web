"use client";

import { VendorStaffForm } from "@/features/vendors/VendorStaffForm";
import { vendorStaffRepository } from "@/lib/mock/vendor-staff";
import type { VendorStaff } from "@/types/vendor";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditVendorStaffPage() {
  const params = useParams();
  const staffId = typeof params?.staffId === "string" ? params.staffId : "";

  const [staff, setStaff] = useState<VendorStaff | null | undefined>(undefined);

  useEffect(() => {
    if (!staffId) {
      setStaff(null);
      return;
    }

    const loadStaff = () => {
      const found = vendorStaffRepository.getStaffById(staffId);
      setStaff(found || null);
    };

    loadStaff();
    const unsubscribe = vendorStaffRepository.subscribe(loadStaff);
    return () => unsubscribe();
  }, [staffId]);

  if (staff === undefined) {
    return (
      <div className="p-8 text-center text-[#5B616B] text-[14px]">
        Loading vendor staff member...
      </div>
    );
  }

  if (staff === null) {
    return (
      <div className="p-8 text-center text-[#DC2626] text-[14px]">
        Vendor staff member with ID &quot;{staffId}&quot; was not found.
      </div>
    );
  }

  return <VendorStaffForm initialData={staff} mode="edit" staffId={staffId} />;
}
