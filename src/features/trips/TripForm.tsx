"use client";

import { customerRepository } from "@/lib/mock/customers";
import { TripValidationError, tripRepository } from "@/lib/mock/trips";
import type { Customer } from "@/types/customer";
import type { Trip, TripStatus } from "@/types/trip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

interface TripFormProps {
  initialTrip?: Trip;
  mode: "create" | "edit";
}

export function TripForm({ initialTrip, mode }: TripFormProps) {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(initialTrip?.customerId || "");
  const [title, setTitle] = useState(initialTrip?.title || "");
  const [destination, setDestination] = useState(initialTrip?.destination || "");
  const [status, setStatus] = useState<TripStatus>(initialTrip?.status || "OPEN");
  const [startDate, setStartDate] = useState(initialTrip?.startDate || "");
  const [endDate, setEndDate] = useState(initialTrip?.endDate || "");
  const [notes, setNotes] = useState(initialTrip?.notes || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const list = customerRepository.listCustomers().items;
    setCustomers(list);
    if (!customerId && list.length > 0 && mode === "create") {
      setCustomerId(list[0].id);
    }
  }, [customerId, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === "create" && !customerId) {
      setErrorMessage("Please select a customer for this trip container.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Trip title is required.");
      return;
    }

    if (!destination.trim()) {
      setErrorMessage("Destination / area is required.");
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage("Both start date and end date are required.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage("End date cannot be earlier than start date.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const created = tripRepository.createTrip({
          customerId,
          title: title.trim(),
          destination: destination.trim(),
          startDate,
          endDate,
          status,
          notes: notes.trim(),
        });
        setSuccessMessage(`Trip container ${created.reference} created successfully.`);
        setTimeout(() => {
          router.push(`/trips/${created.id}`);
        }, 500);
      } else if (initialTrip) {
        const updated = tripRepository.updateTrip(initialTrip.id, {
          title: title.trim(),
          destination: destination.trim(),
          startDate,
          endDate,
          status,
          notes: notes.trim(),
        });
        setSuccessMessage(`Trip container ${updated.reference} updated successfully.`);
        setTimeout(() => {
          router.push(`/trips/${updated.id}`);
        }, 500);
      }
    } catch (err) {
      if (err instanceof TripValidationError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving the trip.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="p-[32px] max-w-[1140px] w-full"
      data-node-id="83:1275"
      data-name="CC-TRIP-03__Concierge__Ready"
    >
      {/* Navigation Breadcrumb */}
      <div className="mb-[16px]">
        <Link
          href={mode === "edit" && initialTrip ? `/trips/${initialTrip.id}` : "/trips"}
          className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
        >
          ← Back to{" "}
          {mode === "edit" && initialTrip ? `Trip (${initialTrip.reference})` : "Trips List"}
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
        <div>
          <h1
            className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
            data-node-id="83:1305"
          >
            {mode === "create" ? "Create Trip Container" : `Edit Trip: ${initialTrip?.reference}`}
          </h1>
          <p className="text-[14px] text-[#5B616B] mt-[4px]">
            Figma CC-TRIP-03 (Node 83:1275) · Scoped to Concierge / Admin / Super Admin
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F1EFEA] border border-[#DDD8CF] rounded-full text-xs font-semibold text-[#0B0C0E] self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#164D53]" />
          Concierge / Operations
        </div>
      </div>

      {/* Scope Disclaimer Callout */}
      <div
        className="mb-[24px] p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[10px] text-[13px] text-[#5B616B] flex items-start gap-3"
        data-node-id="83:1310"
      >
        <span className="font-bold text-[#0B0C0E] text-base leading-none">ℹ</span>
        <div>
          <p className="font-semibold text-[#0B0C0E]">Operational Surface Boundary</p>
          <p className="mt-0.5">
            Customer creation of arbitrary trip containers is not exposed through the Customer App.
            This operational surface is scoped strictly to Concierge/Admin/Super Admin.
          </p>
        </div>
      </div>

      {/* Error / Success Alerts */}
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

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card space-y-[24px]"
      >
        <div className="border-b border-[#DDD8CF] pb-4">
          <h2 className="text-[18px] font-semibold text-[#0B0C0E] leading-[26px]">Trip Details</h2>
          <p className="text-[13px] text-[#5B616B] mt-1">
            Configure the customer itinerary boundary and service schedule dates.
          </p>
        </div>

        {/* Customer Selector (only in create mode or read-only in edit mode) */}
        <div>
          <label
            htmlFor="trip-customer-select"
            className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
          >
            Customer <span className="text-[#DC2626]">*</span>
          </label>
          {mode === "create" ? (
            <select
              id="trip-customer-select"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full max-w-[500px] h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email}) · {c.location}
                </option>
              ))}
            </select>
          ) : (
            <div
              id="trip-customer-select"
              className="w-full max-w-[500px] h-[48px] px-3.5 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[8px] flex items-center text-[14px] font-medium text-[#0B0C0E]"
            >
              {initialTrip?.customerName} ({initialTrip?.customerEmail})
            </div>
          )}
        </div>

        {/* Title and Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="trip-title-input"
              className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
            >
              Trip Title <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="trip-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Thanksgiving in New York"
              className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>

          <div>
            <label
              htmlFor="trip-destination-input"
              className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
            >
              Destination / Area <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="trip-destination-input"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. New York / Manhattan"
              className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
        </div>

        {/* Date Range & Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="trip-start-date"
              className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
            >
              Start Date <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="trip-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
            <p className="text-[12px] text-[#5B616B] mt-1">Service local time</p>
          </div>

          <div>
            <label
              htmlFor="trip-end-date"
              className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
            >
              End Date <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="trip-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
            <p className="text-[12px] text-[#5B616B] mt-1">Service local time</p>
          </div>

          <div>
            <label
              htmlFor="trip-status-select"
              className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
            >
              Status <span className="text-[#DC2626]">*</span>
            </label>
            <select
              id="trip-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as TripStatus)}
              className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="trip-notes-input"
            className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
          >
            Operational Notes / Itinerary Description
          </label>
          <textarea
            id="trip-notes-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter customer preferences, special handling requirements, or trip background..."
            className="w-full p-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-[#DDD8CF]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[48px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Saving..." : mode === "create" ? "Create Trip" : "Save Trip"}
          </button>
          <Link
            href={mode === "edit" && initialTrip ? `/trips/${initialTrip.id}` : "/trips"}
            className="h-[48px] px-[24px] bg-white border border-[#A6A19A] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] transition-colors inline-flex items-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
