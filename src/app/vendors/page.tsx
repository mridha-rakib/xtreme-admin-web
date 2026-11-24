"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { vendorRepository } from "@/lib/mock/vendors";
import type { VendorOrganization, VendorOrganizationStatus } from "@/types/vendor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function VendorsListPage() {
  const router = useRouter();
  const { user } = useSession();

  const [vendors, setVendors] = useState<VendorOrganization[]>([]);
  const [statusFilter, setStatusFilter] = useState<VendorOrganizationStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect Vendor personas to their own organization workspace
  useEffect(() => {
    if (user?.role === "VENDOR") {
      router.replace("/vendor/organization");
    }
  }, [user, router]);

  useEffect(() => {
    const loadVendors = () => {
      const data = vendorRepository.listVendors({
        status: statusFilter,
        search: searchTerm,
      });
      setVendors(data);
    };

    loadVendors();
    const unsubscribe = vendorRepository.subscribe(loadVendors);
    return () => unsubscribe();
  }, [statusFilter, searchTerm]);

  const getStatusBadge = (status: VendorOrganizationStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]";
      case "MAINTENANCE":
        return "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
      case "INACTIVE":
        return "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
      default:
        return "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="86:1679"
        data-name="CC-VEN-01__Admin__Ready"
      >
        {/* Header with Title and Create Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="86:1718"
            >
              Vendors List
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-VEN-01 (Node 86:1679) · Partner vendor organizations directory
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/vendors/create"
              className="h-[48px] px-[20px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors"
              data-node-id="14:2"
            >
              Create vendor
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-4 mb-[24px] flex flex-col md:flex-row gap-4 items-center justify-between shadow-card">
          <div className="relative w-full md:w-[320px]">
            <label htmlFor="search-vendors-input" className="sr-only">
              Search Vendors
            </label>
            <input
              id="search-vendors-input"
              type="text"
              placeholder="Search vendor, legal name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[40px] pl-3 pr-3 text-[14px] border border-[#DDD8CF] rounded-[8px] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label
                htmlFor="vendor-status-filter"
                className="text-[12px] font-medium text-[#5B616B]"
              >
                Status:
              </label>
              <select
                id="vendor-status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as VendorOrganizationStatus | "ALL")
                }
                className="h-[40px] px-3 text-[13px] border border-[#DDD8CF] rounded-[8px] bg-white text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card"
          data-node-id="86:1721"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEE9E0] border-b border-[#DDD8CF] text-[#5B616B] text-[13px] font-semibold">
                  <th className="py-3.5 px-6">Vendor</th>
                  <th className="py-3.5 px-6">Legal name</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Phone</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF]">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#5B616B] text-[14px]">
                      No vendor organizations found matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-4 px-6 text-[14px] font-semibold text-[#0B0C0E]">
                        {v.displayName}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#5B616B]">{v.legalName || "—"}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadge(
                            v.status,
                          )}`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#5B616B]">
                        {v.contactEmail || "—"}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#5B616B]">
                        {v.contactPhone || "—"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/vendors/${v.id}`}
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
      </div>
    </CommandCenterShell>
  );
}
