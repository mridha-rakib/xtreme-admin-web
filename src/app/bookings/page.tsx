"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { bookingRepository } from "@/lib/mock/bookings";
import type { Booking, BookingLifecycleStatus, ServiceCategory } from "@/types/booking";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

export default function BookingsListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingLifecycleStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "All">("All");

  useEffect(() => {
    const loadBookings = () => {
      const result = bookingRepository.listBookings({
        search,
        status: statusFilter,
        serviceCategory: categoryFilter,
      });
      setBookings(result.items);
    };

    loadBookings();
    const unsubscribe = bookingRepository.subscribe(loadBookings);
    return () => unsubscribe();
  }, [search, statusFilter, categoryFilter]);

  const getServiceIcon = (category: ServiceCategory) => {
    switch (category) {
      case "aviation":
        return "/figma-assets/bkg_c0e81ce8-cde.svg";
      case "dining":
        return "/figma-assets/bkg_287cb4a5-5ad.svg";
      case "yacht":
        return "/figma-assets/bkg_99262405-696.svg";
      default:
        return "/figma-assets/bkg_c0e81ce8-cde.svg";
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1140px] w-full"
        data-node-id="81:260"
        data-name="CC-BKG-01__Admin__Ready"
      >
        {/* Header */}
        <div className="mb-[24px]">
          <h1
            className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
            data-node-id="81:299"
          >
            Bookings List
          </h1>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-[16px] mb-[24px]">
          <div
            className="relative flex-1 max-w-[800px] h-[44px] bg-white border border-[#DDD8CF] rounded-[10px] flex items-center px-[13px] shadow-xs"
            data-node-id="81:300"
          >
            <div className="w-[20px] h-[20px] shrink-0 flex items-center justify-center opacity-70">
              <Image src="/figma-assets/bkg_c139e81e-37b.svg" alt="" width={18} height={18} />
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search / filter by reference, customer, or destination..."
              className="w-full h-full bg-transparent pl-[10px] text-[14px] text-[#0B0C0E] placeholder:text-[#5B616B] focus:outline-none"
              data-node-id="81:301"
            />
          </div>

          <Link
            href="/bookings/create"
            className="h-[48px] px-[20px] py-[12px] bg-[#0B0C0E] hover:bg-[#17191D] border-[1.2px] border-[#B48737] rounded-[12px] text-white text-[14px] font-semibold flex items-center justify-center shrink-0 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            data-node-id="81:302"
            data-name="Button/Primary"
          >
            Create on behalf
          </Link>
        </div>

        {/* Table Container */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card"
          data-node-id="81:304"
        >
          {/* Table Header */}
          <div
            className="bg-[#EEE9E0] h-[52px] px-[20px] flex items-center text-[13px] font-semibold text-[#5B616B] tracking-[0.15px] border-b border-[#DDD8CF]"
            data-node-id="81:305"
          >
            <div className="w-[180px] shrink-0">Reference</div>
            <div className="w-[200px] shrink-0">Service</div>
            <div className="w-[180px] shrink-0">Context</div>
            <div className="w-[190px] shrink-0">Status</div>
            <div className="w-[180px] shrink-0">Schedule</div>
            <div className="flex-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#DDD8CF]">
            {bookings.length === 0 ? (
              <div className="py-[48px] text-center text-[#5B616B] text-[14px]">
                No bookings match your current search criteria.
              </div>
            ) : (
              bookings.map((booking) => {
                const isPending =
                  booking.lifecycleStatus === "PENDING_ADMIN" ||
                  booking.lifecycleStatus === "PENDING_VENDOR";
                const isConfirmed = booking.lifecycleStatus === "CONFIRMED";
                const isCancelled = booking.lifecycleStatus === "CANCELLED";

                return (
                  <div
                    key={booking.id}
                    className="h-[58px] px-[20px] flex items-center text-[14px] text-[#0B0C0E] hover:bg-[#FAF8F4] transition-colors"
                  >
                    {/* Reference */}
                    <div className="w-[180px] shrink-0 font-medium">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="hover:underline text-[#0B0C0E]"
                      >
                        {booking.reference}
                      </Link>
                    </div>

                    {/* Service */}
                    <div className="w-[200px] shrink-0 flex items-center gap-[8px] truncate pr-2">
                      <div className="w-[20px] h-[20px] shrink-0 flex items-center justify-center">
                        <Image
                          src={getServiceIcon(booking.serviceCategory)}
                          alt=""
                          width={16}
                          height={16}
                          className="opacity-80"
                        />
                      </div>
                      <span className="truncate">{booking.serviceName.split("·")[0].trim()}</span>
                    </div>

                    {/* Context (Customer) */}
                    <div className="w-[180px] shrink-0 truncate pr-2 text-[#0B0C0E]">
                      {booking.customerName}
                    </div>

                    {/* Status Pill */}
                    <div className="w-[190px] shrink-0">
                      {isPending && (
                        <span className="inline-flex items-center px-[12px] py-[4px] rounded-full bg-[#f9eccd] text-[#6c4a13] text-[12px] font-semibold tracking-[0.1px]">
                          {booking.lifecycleStatus.replace("_", " ")}
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="inline-flex items-center px-[12px] py-[4px] rounded-full bg-[#E5F4E3] text-[#226E35] text-[12px] font-semibold tracking-[0.1px]">
                          CONFIRMED
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center px-[12px] py-[4px] rounded-full bg-[#FEECEC] text-[#991B1B] text-[12px] font-semibold tracking-[0.1px]">
                          CANCELLED
                        </span>
                      )}
                      {!isPending && !isConfirmed && !isCancelled && (
                        <span className="inline-flex items-center px-[12px] py-[4px] rounded-full bg-[#EEE9E0] text-[#5B616B] text-[12px] font-semibold tracking-[0.1px]">
                          {booking.lifecycleStatus}
                        </span>
                      )}
                    </div>

                    {/* Schedule */}
                    <div className="w-[180px] shrink-0 text-[13px] text-[#5B616B] truncate">
                      {booking.scheduleDisplay.split("·")[0]} ·{" "}
                      {booking.scheduleDisplay.split("·")[1]?.trim() || ""}
                    </div>

                    {/* Actions */}
                    <div className="flex-1 text-right">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] hover:underline transition-colors"
                      >
                        View ›
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </CommandCenterShell>
  );
}
