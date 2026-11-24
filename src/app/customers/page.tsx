"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { customerRepository } from "@/lib/mock/customers";
import type {
  Customer,
  CustomerMembershipTier,
  CustomerRegion,
  CustomerStatus,
} from "@/types/customer";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

export default function CustomersListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [membershipTier, setMembershipTier] = useState<CustomerMembershipTier>("All");
  const [status, setStatus] = useState<CustomerStatus>("All");
  const [region, setRegion] = useState<CustomerRegion>("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const loadData = () => {
      try {
        const result = customerRepository.listCustomers({
          search,
          membershipTier,
          status,
          region,
          page,
          pageSize: 10,
        });
        setCustomers(result.items);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
    const unsubscribe = customerRepository.subscribe(loadData);
    return () => unsubscribe();
  }, [search, membershipTier, status, region, page]);

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1200px] w-full"
        data-node-id="77:239"
        data-name="CC-CUS-01__Customers_List__Ready"
      >
        {/* Header and Add Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-[32px]">
          <div>
            <h1
              className="text-[31px] font-bold leading-[38px] text-[#0B0C0E]"
              data-node-id="1128:6877"
            >
              Customers
            </h1>
            <p
              className="text-[20px] font-normal leading-[28px] text-[#0B0C0E] mt-[4px]"
              data-node-id="1128:6878"
            >
              Customer directory and relationship management
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-[215px] h-[50px] bg-[#A88343] hover:bg-[#967439] text-white text-[15px] font-semibold rounded-[9px] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
            data-node-id="1128:6879"
            data-name="Action / + Add Customer"
          >
            + Add Customer
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center gap-[12px] mb-[28px]">
          {/* Membership Tier Dropdown */}
          <div className="relative w-[240px] h-[47px] bg-white border border-[#DDD8CF] rounded-[8px] flex items-center px-[12px]">
            <div className="w-[23px] h-[23px] shrink-0 flex items-center justify-center">
              <Image
                src="/figma-assets/imgVectorIconLayers1.svg"
                alt=""
                width={18}
                height={18}
                className="opacity-70"
              />
            </div>
            <select
              value={membershipTier}
              onChange={(e) => {
                setMembershipTier(e.target.value as CustomerMembershipTier);
                setPage(1);
              }}
              className="w-full h-full bg-transparent pl-[8px] pr-[16px] text-[14px] text-[#0B0C0E] font-medium appearance-none focus:outline-none cursor-pointer"
            >
              <option value="All">All Membership Tiers</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="VIP Black">VIP Black</option>
            </select>
            <div className="absolute right-[12px] pointer-events-none">
              <Image src="/figma-assets/imgVectorIconDown1.svg" alt="" width={14} height={14} />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative w-[210px] h-[47px] bg-white border border-[#DDD8CF] rounded-[8px] flex items-center px-[12px]">
            <div className="w-[23px] h-[23px] shrink-0 flex items-center justify-center">
              <Image
                src="/figma-assets/imgVectorIconHeartbeat.svg"
                alt=""
                width={18}
                height={18}
                className="opacity-70"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as CustomerStatus);
                setPage(1);
              }}
              className="w-full h-full bg-transparent pl-[8px] pr-[16px] text-[14px] text-[#0B0C0E] font-medium appearance-none focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
            <div className="absolute right-[12px] pointer-events-none">
              <Image src="/figma-assets/imgVectorIconDown1.svg" alt="" width={14} height={14} />
            </div>
          </div>

          {/* Region Dropdown */}
          <div className="relative w-[210px] h-[47px] bg-white border border-[#DDD8CF] rounded-[8px] flex items-center px-[12px]">
            <div className="w-[23px] h-[23px] shrink-0 flex items-center justify-center">
              <Image
                src="/figma-assets/imgVectorIconPin1.svg"
                alt=""
                width={18}
                height={18}
                className="opacity-70"
              />
            </div>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value as CustomerRegion);
                setPage(1);
              }}
              className="w-full h-full bg-transparent pl-[8px] pr-[16px] text-[14px] text-[#0B0C0E] font-medium appearance-none focus:outline-none cursor-pointer"
            >
              <option value="All">All Regions</option>
              <option value="New York, US">New York, US</option>
              <option value="Los Angeles, US">Los Angeles, US</option>
              <option value="London, UK">London, UK</option>
              <option value="Paris, FR">Paris, FR</option>
              <option value="Zurich, CH">Zurich, CH</option>
              <option value="Tokyo, JP">Tokyo, JP</option>
              <option value="Dubai, UAE">Dubai, UAE</option>
            </select>
            <div className="absolute right-[12px] pointer-events-none">
              <Image src="/figma-assets/imgVectorIconDown1.svg" alt="" width={14} height={14} />
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px] h-[47px] bg-[#EEE9E0] border border-[#DDD8CF] rounded-[8px] flex items-center px-[14px]">
            <div className="w-[23px] h-[23px] shrink-0 flex items-center justify-center">
              <Image
                src="/figma-assets/imgVectorIconSearch1.svg"
                alt=""
                width={18}
                height={18}
                className="opacity-60"
              />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search customers"
              className="w-full h-full bg-transparent pl-[10px] text-[14px] text-[#0B0C0E] placeholder:text-[#5B616B] focus:outline-none"
            />
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-sm">
          {/* Table Header */}
          <div
            className="h-[52px] bg-[#EEE9E0] px-[20px] flex items-center text-[14px] font-semibold text-[#0B0C0E]"
            data-node-id="1128:6905"
            data-name="Table header"
          >
            <div className="w-[240px]">Customer</div>
            <div className="w-[140px]">Membership</div>
            <div className="w-[160px]">Location</div>
            <div className="w-[140px]">Last Booking</div>
            <div className="w-[130px]">Total Bookings</div>
            <div className="w-[120px]">Status</div>
            <div className="flex-1 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#DDD8CF]/60">
            {customers.length === 0 ? (
              <div className="py-[48px] text-center text-[14px] text-[#5B616B]">
                No customers match your search and filter criteria.
              </div>
            ) : (
              customers.map((c) => {
                const statusStyles = {
                  Active: "bg-[#E8F5E9] text-[#0E7047] border-[#A5D6A7]",
                  Inactive: "bg-[#F4F0E8] text-[#5B616B] border-[#DDD8CF]",
                  Suspended: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]",
                };

                const tierStyles = {
                  Platinum: "bg-[#F1E7D2] text-[#A88343] border-[#E2D2B0]",
                  Gold: "bg-[#FFF8E1] text-[#B26A00] border-[#FFE082]",
                  Silver: "bg-[#F4F0E8] text-[#5B616B] border-[#DDD8CF]",
                  "VIP Black": "bg-[#0B0C0E] text-white border-[#24272D]",
                };

                return (
                  <div
                    key={c.id}
                    className="h-[64px] px-[20px] flex items-center text-[14px] hover:bg-[#FAF8F4] transition-colors"
                  >
                    {/* Customer Name & Email */}
                    <div className="w-[240px]">
                      <p className="font-semibold text-[#0B0C0E] leading-tight">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-[12px] text-[#5B616B] leading-tight mt-0.5">{c.email}</p>
                    </div>

                    {/* Membership Tier */}
                    <div className="w-[140px]">
                      <span
                        className={`inline-flex items-center gap-1.5 px-[9px] py-[2px] rounded-full text-[12px] font-semibold border ${tierStyles[c.membershipTier]}`}
                      >
                        {c.membershipTier === "Platinum" || c.membershipTier === "VIP Black" ? (
                          <Image
                            src="/figma-assets/imgVectorIconCrown.svg"
                            alt=""
                            width={12}
                            height={12}
                          />
                        ) : null}
                        {c.membershipTier}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="w-[160px] text-[13px] text-[#0B0C0E]">{c.location}</div>

                    {/* Last Booking */}
                    <div className="w-[140px] text-[13px] text-[#5B616B]">{c.lastBookingDate}</div>

                    {/* Total Bookings */}
                    <div className="w-[130px] font-semibold text-[#0B0C0E] text-[14px]">
                      {c.totalBookings}
                    </div>

                    {/* Status Badge */}
                    <div className="w-[120px]">
                      <span
                        className={`inline-flex px-[8px] py-[2px] rounded-full text-[12px] font-semibold border ${statusStyles[c.status]}`}
                      >
                        {c.status}
                      </span>
                    </div>

                    {/* Actions Link */}
                    <div className="flex-1 text-right">
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-[#164D53] hover:text-[#0B0C0E] font-semibold text-[13px] inline-flex items-center gap-1"
                      >
                        View ›
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="h-[48px] px-[20px] bg-[#FAF8F4] border-t border-[#DDD8CF] flex items-center justify-between text-[13px] text-[#5B616B]">
              <span>
                Showing {customers.length} of {totalCount} customers
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 bg-white border border-[#DDD8CF] rounded text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 bg-white border border-[#DDD8CF] rounded text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Informational Modal for + Add Customer */}
        {showAddModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          >
            <div className="w-full max-w-md bg-white border border-[#DDD8CF] rounded-xl shadow-modal p-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDD8CF]">
                <h3 className="text-base font-bold text-[#0B0C0E]">Create Customer Account</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-[#5B616B] hover:text-[#0B0C0E] text-sm p-1 cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="py-4 text-xs text-[#5B616B] space-y-2">
                <p>
                  In accordance with the approved Section 05 Command Center architecture, customer
                  registration is managed exclusively via the customer intake journey or verified
                  identity workflows.
                </p>
                <div className="p-3 bg-[#FAF8F4] rounded border border-[#DDD8CF] text-[#0B0C0E] font-medium">
                  Scope Guard: Direct manual creation of raw customer records is restricted in this
                  foundation build.
                </div>
              </div>
              <div className="pt-3 border-t border-[#DDD8CF] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D] cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CommandCenterShell>
  );
}
