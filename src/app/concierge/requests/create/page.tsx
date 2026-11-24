"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import {
  ConciergeValidationError,
  conciergeRequestRepository,
} from "@/lib/mock/concierge-requests";
import { customerRepository } from "@/lib/mock/customers";
import { tripRepository } from "@/lib/mock/trips";
import type { ConciergeRequestType } from "@/types/concierge";
import type { Customer } from "@/types/customer";
import type { Trip } from "@/types/trip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function CreateConciergeRequestPage() {
  const router = useRouter();
  const { user } = useSession();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [tripId, setTripId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [type, setType] = useState<ConciergeRequestType>("PLAN_TRIP");
  const [details, setDetails] = useState("");
  const [assignedStaffName, setAssignedStaffName] = useState(user?.name || "Elena Rostova");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const custs = customerRepository.listCustomers().items;
    setCustomers(custs);
    if (custs.length > 0 && !customerId) {
      setCustomerId(custs[0].id);
    }
    setTrips(tripRepository.listTrips());
  }, [customerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!customerId) {
      setErrorMessage("Please select a customer.");
      return;
    }

    if (!details.trim()) {
      setErrorMessage("Request details are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = conciergeRequestRepository.createRequest({
        customerId,
        tripId: tripId || undefined,
        serviceName: serviceName.trim() || undefined,
        type,
        details: details.trim(),
        assignedStaffName: assignedStaffName.trim() || "Elena Rostova",
      });

      setSuccessMessage(`Concierge request ${created.reference} created successfully.`);
      setTimeout(() => {
        router.push(`/concierge/requests/${created.id}`);
      }, 500);
    } catch (err) {
      if (err instanceof ConciergeValidationError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while creating the request.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1140px] w-full"
        data-node-id="83:1698"
        data-name="CC-CON-05__Concierge__Ready"
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

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="83:1735"
            >
              Create Concierge Request on Behalf
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-CON-05 (Node 83:1698) · VIP customer intake and coordination request
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F1EFEA] border border-[#DDD8CF] rounded-full text-xs font-semibold text-[#0B0C0E]">
            <span className="w-2 h-2 rounded-full bg-[#164D53]" />
            Concierge Desk
          </div>
        </div>

        {/* Inventory Rule Callout */}
        <div
          className="mb-[24px] p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[10px] text-[13px] text-[#5B616B] flex items-start gap-3"
          data-node-id="83:1745"
        >
          <span className="font-bold text-[#0B0C0E] text-base leading-none">ℹ</span>
          <div>
            <p className="font-semibold text-[#0B0C0E]">Inventory Rule</p>
            <p className="mt-0.5">
              Creating a Concierge request does not reserve inventory. Any later concrete service
              booking must use normal Booking + Availability orchestration.
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card space-y-[24px]"
        >
          <div className="border-b border-[#DDD8CF] pb-4">
            <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px]">
              Request Information
            </h2>
            <p className="text-[13px] text-[#5B616B] mt-1">
              Select the customer and contextual details for this operational intake.
            </p>
          </div>

          {/* Customer & Trip Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="con-customer-select"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Customer <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="con-customer-select"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.email}) · {c.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="con-trip-select"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Linked Trip Container (Optional)
              </label>
              <select
                id="con-trip-select"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="">None (Individual Request)</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.reference} · {t.title} ({t.customerName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Context & Assigned Concierge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="con-service-input"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Service Context (Optional)
              </label>
              <input
                id="con-service-input"
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Airport Transfer · JFK, Villa Chef"
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            <div>
              <label
                htmlFor="con-staff-input"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Assigned Concierge
              </label>
              <input
                id="con-staff-input"
                type="text"
                value={assignedStaffName}
                onChange={(e) => setAssignedStaffName(e.target.value)}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>
          </div>

          {/* Request Type */}
          <div>
            <span className="block text-[14px] font-semibold text-[#0B0C0E] mb-2">
              Request Type <span className="text-[#DC2626]">*</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label
                htmlFor="req-type-plan"
                className={`flex items-center gap-3 p-4 border rounded-[10px] cursor-pointer transition-colors ${
                  type === "PLAN_TRIP"
                    ? "border-[#0B0C0E] bg-[#F1EFEA]"
                    : "border-[#DDD8CF] bg-white hover:bg-[#FAF8F4]"
                }`}
              >
                <input
                  id="req-type-plan"
                  type="radio"
                  name="requestType"
                  value="PLAN_TRIP"
                  checked={type === "PLAN_TRIP"}
                  onChange={() => setType("PLAN_TRIP")}
                  className="w-4 h-4 text-[#0B0C0E] focus:ring-0"
                />
                <div>
                  <span className="block text-[14px] font-bold text-[#0B0C0E]">PLAN_TRIP</span>
                  <span className="block text-[12px] text-[#5B616B]">Itinerary coordination</span>
                </div>
              </label>

              <label
                htmlFor="req-type-service"
                className={`flex items-center gap-3 p-4 border rounded-[10px] cursor-pointer transition-colors ${
                  type === "SERVICE_REQUEST"
                    ? "border-[#0B0C0E] bg-[#F1EFEA]"
                    : "border-[#DDD8CF] bg-white hover:bg-[#FAF8F4]"
                }`}
              >
                <input
                  id="req-type-service"
                  type="radio"
                  name="requestType"
                  value="SERVICE_REQUEST"
                  checked={type === "SERVICE_REQUEST"}
                  onChange={() => setType("SERVICE_REQUEST")}
                  className="w-4 h-4 text-[#0B0C0E] focus:ring-0"
                />
                <div>
                  <span className="block text-[14px] font-bold text-[#0B0C0E]">
                    SERVICE_REQUEST
                  </span>
                  <span className="block text-[12px] text-[#5B616B]">Specific vendor service</span>
                </div>
              </label>

              <label
                htmlFor="req-type-special"
                className={`flex items-center gap-3 p-4 border rounded-[10px] cursor-pointer transition-colors ${
                  type === "SPECIAL_REQUEST"
                    ? "border-[#0B0C0E] bg-[#F1EFEA]"
                    : "border-[#DDD8CF] bg-white hover:bg-[#FAF8F4]"
                }`}
              >
                <input
                  id="req-type-special"
                  type="radio"
                  name="requestType"
                  value="SPECIAL_REQUEST"
                  checked={type === "SPECIAL_REQUEST"}
                  onChange={() => setType("SPECIAL_REQUEST")}
                  className="w-4 h-4 text-[#0B0C0E] focus:ring-0"
                />
                <div>
                  <span className="block text-[14px] font-bold text-[#0B0C0E]">
                    SPECIAL_REQUEST
                  </span>
                  <span className="block text-[12px] text-[#5B616B]">Custom bespoke intake</span>
                </div>
              </label>
            </div>
          </div>

          {/* Details */}
          <div>
            <label
              htmlFor="con-details-input"
              className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
            >
              Request Details &amp; Specifications <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              id="con-details-input"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe VIP preferences, timings, attendee counts, or special requests..."
              className="w-full p-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center gap-4 border-t border-[#DDD8CF]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[48px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
            <Link
              href="/concierge/requests"
              className="h-[48px] px-[24px] bg-white border border-[#A6A19A] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </CommandCenterShell>
  );
}
