"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { conciergeRequestRepository } from "@/lib/mock/concierge-requests";
import type {
  ConciergeRequest,
  ConciergeRequestStatus,
  ConciergeRequestType,
} from "@/types/concierge";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function ConciergeRequestsPage() {
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ConciergeRequestType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ConciergeRequestStatus | "ALL">("ALL");

  useEffect(() => {
    const loadData = () => {
      setRequests(conciergeRequestRepository.listRequests());
    };
    loadData();
    const unsubscribe = conciergeRequestRepository.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "ALL" || r.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: ConciergeRequestStatus) => {
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

  const getTypeBadge = (type: ConciergeRequestType) => {
    switch (type) {
      case "PLAN_TRIP":
        return "bg-[#EDE9FE] text-[#6D28D9]";
      case "SERVICE_REQUEST":
        return "bg-[#E0E7FF] text-[#3730A3]";
      case "SPECIAL_REQUEST":
        return "bg-[#FEF3C7] text-[#92400E]";
      default:
        return "bg-[#F3F4F6] text-[#374151]";
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="83:1347"
        data-name="CC-CON-01__Concierge__Ready"
      >
        {/* Module Sub-navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-[#DDD8CF] mb-[24px]">
          <Link
            href="/concierge/requests"
            className="pb-3 border-b-2 border-[#0B0C0E] text-[14px] font-bold text-[#0B0C0E]"
          >
            Requests List
          </Link>
          <Link
            href="/concierge/conversations"
            className="pb-3 text-[14px] font-medium text-[#5B616B] hover:text-[#0B0C0E] transition-colors"
          >
            Conversation Inbox
          </Link>
        </div>

        {/* Header with Title and Create Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="83:1385"
            >
              Concierge Requests List
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-CON-01 (Node 83:1347) · Customer service coordination &amp; inquiries
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/concierge/requests/create"
              className="h-[48px] px-[20px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors"
              data-node-id="14:2"
            >
              + Create Request on Behalf
            </Link>
          </div>
        </div>

        {/* Operational Boundary Notice */}
        <div
          className="mb-[24px] p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[10px] text-[13px] text-[#5B616B] flex items-start gap-3"
          data-node-id="83:1390"
        >
          <span className="font-bold text-[#0B0C0E] text-base leading-none">ℹ</span>
          <div>
            <p className="font-semibold text-[#0B0C0E]">Operational Architecture Notice</p>
            <p className="mt-0.5">
              PLAN_TRIP, SERVICE_REQUEST and SPECIAL_REQUEST coordination remains separate from
              concrete booking and inventory allocation. Managing a Concierge request does not hold
              inventory or trigger payment collection.
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-4 mb-[24px] flex flex-col md:flex-row gap-4 items-center justify-between shadow-card">
          <div className="relative w-full md:w-[320px]">
            <label htmlFor="search-requests-input" className="sr-only">
              Search Requests
            </label>
            <input
              id="search-requests-input"
              type="text"
              placeholder="Search reference, customer, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[40px] pl-3 pr-3 text-[14px] border border-[#DDD8CF] rounded-[8px] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label
                htmlFor="type-filter-select"
                className="text-[12px] font-medium text-[#5B616B]"
              >
                Type:
              </label>
              <select
                id="type-filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ConciergeRequestType | "ALL")}
                className="h-[40px] px-3 text-[13px] border border-[#DDD8CF] rounded-[8px] bg-white text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Types</option>
                <option value="PLAN_TRIP">PLAN_TRIP</option>
                <option value="SERVICE_REQUEST">SERVICE_REQUEST</option>
                <option value="SPECIAL_REQUEST">SPECIAL_REQUEST</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="status-filter-select"
                className="text-[12px] font-medium text-[#5B616B]"
              >
                Status:
              </label>
              <select
                id="status-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ConciergeRequestStatus | "ALL")}
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
        </div>

        {/* Requests Table */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card"
          data-node-id="83:1400"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FAF8F4] border-b border-[#DDD8CF] text-[#5B616B] text-[12px] uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-6">Customer / Trip</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Assigned</th>
                  <th className="py-3.5 px-6">Updated</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF]">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5B616B] text-[14px]">
                      No concierge requests found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#0B0C0E]">
                        <Link
                          href={`/concierge/requests/${req.id}`}
                          className="hover:text-[#164D53]"
                        >
                          {req.reference}
                        </Link>
                      </td>

                      <td className="py-4 px-6">
                        <Link
                          href={`/customers/${req.customerId}`}
                          className="font-semibold text-[#0B0C0E] hover:underline block"
                        >
                          {req.customerName}
                        </Link>
                        <span className="text-[12px] text-[#5B616B] block">
                          {req.tripReference ? `Trip: ${req.tripReference}` : "General request"}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${getTypeBadge(
                            req.type,
                          )}`}
                        >
                          {req.type}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadge(
                            req.status,
                          )}`}
                        >
                          {req.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-[#0B0C0E] font-medium">
                        {req.assignedStaffName}
                      </td>

                      <td className="py-4 px-6 text-[#5B616B] text-[13px]">{req.updatedDisplay}</td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/concierge/requests/${req.id}`}
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
