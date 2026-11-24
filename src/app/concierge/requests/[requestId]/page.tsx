"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import {
  ConciergeValidationError,
  conciergeRequestRepository,
} from "@/lib/mock/concierge-requests";
import { conversationRepository } from "@/lib/mock/conversations";
import type { ConciergeRequest, ConciergeRequestStatus } from "@/types/concierge";
import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function ConciergeRequestDetailPage() {
  const params = useParams();
  const requestId = params?.requestId as string;

  const [request, setRequest] = useState<ConciergeRequest | null | undefined>(undefined);
  const [status, setStatus] = useState<ConciergeRequestStatus>("OPEN");
  const [assignedStaffName, setAssignedStaffName] = useState("");
  const [details, setDetails] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;

    const loadData = () => {
      const r = conciergeRequestRepository.getRequestById(requestId);
      if (r) {
        setRequest({ ...r });
        setStatus(r.status);
        setAssignedStaffName(r.assignedStaffName);
        setDetails(r.details);

        // Find linked conversation
        const conv = conversationRepository.getConversationByRequest(r.id);
        if (conv) {
          setConversationId(conv.id);
        } else {
          const customerConv = conversationRepository.getConversationByCustomer(r.customerId);
          setConversationId(customerConv ? customerConv.id : "conv_001");
        }
      } else {
        setRequest(null);
      }
    };

    loadData();
    const unsubscribe = conciergeRequestRepository.subscribe(loadData);
    return () => unsubscribe();
  }, [requestId]);

  if (request === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading concierge request...</div>
      </CommandCenterShell>
    );
  }

  if (request === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Concierge Request Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              No concierge request record exists for identifier &ldquo;{requestId}&rdquo;.
            </p>
            <Link
              href="/concierge/requests"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Requests List
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      conciergeRequestRepository.updateRequest(request.id, {
        status,
        assignedStaffName: assignedStaffName.trim(),
        details: details.trim(),
      });
      setSuccessMessage("Concierge request updated successfully.");
    } catch (err) {
      if (err instanceof ConciergeValidationError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving updates.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (s: ConciergeRequestStatus) => {
    switch (s) {
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
        data-node-id="83:1455"
        data-name="CC-CON-02__Concierge__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/concierge/requests"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Concierge Requests
          </Link>
        </div>

        {/* Header with Title and Conversation Link */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="83:1495"
            >
              Concierge Request Detail / Management
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-CON-02 (Node 83:1455) · Context: {request.reference}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {conversationId && (
              <Link
                href={`/concierge/conversations/${conversationId}`}
                className="h-[48px] px-[20px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors"
              >
                Open Conversation ›
              </Link>
            )}
          </div>
        </div>

        {/* Operational Boundary Notice */}
        <div
          className="mb-[24px] p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[10px] text-[13px] text-[#5B616B] flex items-start gap-3"
          data-node-id="83:1520"
        >
          <span className="font-bold text-[#0B0C0E] text-base leading-none">ℹ</span>
          <div>
            <p className="font-semibold text-[#0B0C0E]">Inventory &amp; Booking Boundary</p>
            <p className="mt-0.5">
              Managing this request alone reserves no inventory. Concrete bookings must be executed
              independently through Booking Management.
            </p>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {errorMessage && (
          <div className="mb-[24px] p-4 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[10px] text-[#9B1C1C] text-[14px] font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-[#9B1C1C] font-bold text-sm ml-4"
            >
              ✕
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-[24px] p-4 bg-[#DEF7EC] border border-[#84E1BC] rounded-[10px] text-[#03543F] text-[14px] font-medium">
            {successMessage}
          </div>
        )}

        <div className="space-y-[24px]">
          {/* Card 1: Request Context */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="83:1500"
          >
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px]">
                Request context
              </h2>
              <span
                className={`px-3 py-1 text-[12px] font-bold rounded-full border ${getStatusBadge(
                  request.status,
                )}`}
              >
                {request.status.replace("_", " ")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Reference
                </span>
                <span className="block text-[16px] font-bold text-[#0B0C0E] mt-1 font-mono">
                  {request.reference}
                </span>
                <span className="block text-[12px] text-[#5B616B] mt-0.5">ID: {request.id}</span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Customer / Trip
                </span>
                <Link
                  href={`/customers/${request.customerId}`}
                  className="block text-[16px] font-bold text-[#164D53] hover:underline mt-1"
                >
                  {request.customerName}
                </Link>
                <span className="block text-[12px] text-[#5B616B] mt-0.5">
                  {request.tripId ? (
                    <Link href={`/trips/${request.tripId}`} className="hover:underline">
                      Trip: {request.tripReference || request.tripId}
                    </Link>
                  ) : (
                    "General coordination"
                  )}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Service
                </span>
                <span className="block text-[16px] font-semibold text-[#0B0C0E] mt-1">
                  {request.serviceName || "Optional service context"}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Type
                </span>
                <span className="block text-[16px] font-semibold text-[#0B0C0E] mt-1">
                  {request.type} ({request.typeDisplay})
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Assigned Concierge
                </span>
                <span className="block text-[16px] font-semibold text-[#0B0C0E] mt-1">
                  {request.assignedStaffName}
                </span>
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#5B616B] uppercase tracking-[0.5px]">
                  Updated
                </span>
                <span className="block text-[16px] font-semibold text-[#0B0C0E] mt-1">
                  {request.updatedDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Details */}
          <div
            className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card"
            data-node-id="83:1510"
          >
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px] mb-[12px]">
              Details
            </h2>
            <div className="p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] leading-[22px]">
              {request.details}
            </div>
          </div>

          {/* Card 3: Management Controls Form */}
          <form
            onSubmit={handleSave}
            className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card space-y-[20px]"
            data-node-id="83:1515"
          >
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px]">
              Management controls
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="req-status-select"
                  className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
                >
                  Status
                </label>
                <select
                  id="req-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ConciergeRequestStatus)}
                  className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="req-assigned-staff"
                  className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
                >
                  Assigned Concierge
                </label>
                <input
                  id="req-assigned-staff"
                  type="text"
                  value={assignedStaffName}
                  onChange={(e) => setAssignedStaffName(e.target.value)}
                  className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="req-details-edit"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Update Request Notes
              </label>
              <textarea
                id="req-details-edit"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            <div className="pt-2 flex items-center gap-4 border-t border-[#DDD8CF]">
              <button
                type="submit"
                disabled={isSaving}
                className="h-[48px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Saving..." : "Save Updates"}
              </button>
              <Link
                href="/concierge/requests"
                className="h-[48px] px-[24px] bg-white border border-[#A6A19A] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] transition-colors inline-flex items-center"
              >
                Back to Requests
              </Link>
            </div>
          </form>
        </div>
      </div>
    </CommandCenterShell>
  );
}
