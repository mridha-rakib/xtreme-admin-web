"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { tripRepository } from "@/lib/mock/trips";
import type { Trip, TripStatus } from "@/types/trip";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function TripsListPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "ALL">("ALL");

  useEffect(() => {
    const loadData = () => {
      setTrips(tripRepository.listTrips());
    };
    loadData();
    const unsubscribe = tripRepository.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case "OPEN":
        return "bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]";
      case "IN_PROGRESS":
        return "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
      case "COMPLETED":
        return "bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]";
      case "CANCELLED":
        return "bg-[#FDE8E8] text-[#9B1C1C] border-[#F8B4B4]";
      default:
        return "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="83:1108"
        data-name="CC-TRIP-01__Concierge__Ready"
      >
        {/* Header with Title and Create Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="83:1145"
            >
              Trips List
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-TRIP-01 (Node 83:1108) · Planning containers &amp; itineraries
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/trips/create"
              className="h-[48px] px-[20px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors"
              data-node-id="14:2"
            >
              + Create Trip
            </Link>
          </div>
        </div>

        {/* Operational Scope Banner */}
        <div
          className="mb-[24px] p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[10px] text-[13px] text-[#5B616B] flex items-start gap-3"
          data-node-id="83:1146"
        >
          <span className="font-bold text-[#0B0C0E] text-base leading-none">ℹ</span>
          <div>
            <p className="font-semibold text-[#0B0C0E]">Trip Container Architecture</p>
            <p className="mt-0.5">
              A trip is an organizational container. Trip state does not automatically confirm, hold
              inventory, or cancel linked bookings. Linked bookings maintain independent operational
              lifecycles.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-4 mb-[24px] flex flex-col sm:flex-row gap-4 items-center justify-between shadow-card">
          <div className="relative w-full sm:w-[320px]">
            <input
              type="text"
              placeholder="Search reference, customer, destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[40px] pl-3 pr-3 text-[14px] border border-[#DDD8CF] rounded-[8px] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[12px] font-medium text-[#5B616B]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TripStatus | "ALL")}
              className="h-[40px] px-3 text-[13px] border border-[#DDD8CF] rounded-[8px] bg-white text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Trips Table */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card"
          data-node-id="83:1150"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FAF8F4] border-b border-[#DDD8CF] text-[#5B616B] text-[12px] uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Destination</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Dates</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF]">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#5B616B] text-[14px]">
                      No trips found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                      <td className="py-4 px-6">
                        <Link
                          href={`/trips/${trip.id}`}
                          className="font-bold text-[#0B0C0E] hover:text-[#164D53]"
                        >
                          {trip.reference}
                        </Link>
                        <span className="block text-[12px] text-[#5B616B] truncate max-w-[200px]">
                          {trip.title}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-semibold text-[#0B0C0E] block">
                          {trip.customerName}
                        </span>
                        <span className="text-[12px] text-[#5B616B] block">
                          {trip.customerEmail}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-[#0B0C0E] font-medium">{trip.destination}</td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadge(
                            trip.status,
                          )}`}
                        >
                          {trip.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-[#5B616B] font-medium">{trip.datesDisplay}</td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/trips/${trip.id}`}
                          className="text-[#164D53] hover:text-[#0B0C0E] font-semibold text-[13px] inline-flex items-center gap-1"
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
