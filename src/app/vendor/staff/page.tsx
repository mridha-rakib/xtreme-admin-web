"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { vendorStaffRepository } from "@/lib/mock/vendor-staff";
import { vendorRepository } from "@/lib/mock/vendors";
import type { VendorStaff } from "@/types/vendor";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function VendorStaffPage() {
  const { user } = useSession();

  const [staffList, setStaffList] = useState<VendorStaff[]>([]);
  const [vendorName, setVendorName] = useState<string>("");
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  useEffect(() => {
    // Resolve vendorId strictly for authenticated session
    const effectiveVendorId =
      user?.vendorId ||
      (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? "vnd_aerojet_99" : null);

    if (!effectiveVendorId) {
      setStaffList([]);
      setVendorName("");
      return;
    }

    const org = vendorRepository.getVendorById(effectiveVendorId);
    setVendorName(org?.displayName || effectiveVendorId);

    const loadStaff = () => {
      const staff = vendorStaffRepository.listStaffByVendor(effectiveVendorId);
      setStaffList(staff);
    };

    loadStaff();
    const unsubscribe = vendorStaffRepository.subscribe(loadStaff);
    return () => unsubscribe();
  }, [user]);

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="86:1986"
        data-name="CC-VEN-05__Vendor__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/vendor/organization"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to My Organization
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="86:2025"
            >
              Vendor Staff
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-VEN-05 (Node 86:1986) · Organization: {vendorName} (Scoped Workspace)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/vendor/staff/manage"
              className="h-[48px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors"
              data-node-id="14:2"
            >
              Manage association
            </Link>
          </div>
        </div>

        {/* Scope Guard Notice if Manage or View clicked */}
        {activeNotice && (
          <div className="mb-[24px] p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] text-[#1E40AF] text-[13px] flex items-center justify-between">
            <span>{activeNotice}</span>
            <button
              type="button"
              onClick={() => setActiveNotice(null)}
              className="text-[#1E40AF] font-bold text-sm ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Staff Table */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card mb-[16px]"
          data-node-id="86:2028"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEE9E0] border-b border-[#DDD8CF] text-[#5B616B] text-[13px] font-semibold">
                  <th className="py-3.5 px-6">User / Identity</th>
                  <th className="py-3.5 px-6">Staff type</th>
                  <th className="py-3.5 px-6">Employee code</th>
                  <th className="py-3.5 px-6">Active</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF]">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#5B616B] text-[14px]">
                      No staff associations found for this vendor organization.
                    </td>
                  </tr>
                ) : (
                  staffList.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-4 px-6">
                        <div className="text-[14px] font-semibold text-[#0B0C0E]">{s.name}</div>
                        <div className="text-[12px] text-[#5B616B]">{s.email}</div>
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#5B616B]">
                        <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-[#F1EFEA] text-[#0B0C0E]">
                          {s.staffType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[14px] font-mono text-[#0B0C0E]">
                        {s.employeeCode}
                      </td>
                      <td className="py-4 px-6 text-[14px]">
                        {s.active ? (
                          <span className="text-[#03543F] font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-[#5B616B] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/vendor/staff/${s.id}/edit`}
                          className="text-[#164D53] hover:text-[#0B0C0E] font-semibold text-[14px] inline-flex items-center gap-1"
                        >
                          View ›
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-[12px] text-[#5B616B]" data-node-id="86:2077">
          Own Vendor staff associations only.
        </p>
      </div>
    </CommandCenterShell>
  );
}
