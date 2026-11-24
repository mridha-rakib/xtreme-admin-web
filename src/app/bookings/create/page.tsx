"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { bookingRepository } from "@/lib/mock/bookings";
import { customerRepository } from "@/lib/mock/customers";
import type { Customer } from "@/types/customer";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function CreateBookingOnBehalfPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("cus_001");
  const [selectedServiceId, setSelectedServiceId] = useState("srv_airport");
  const [vendorService, setVendorService] = useState("Executive Sedan Pickup");
  const [tripId, setTripId] = useState("TRIP-261124-04");
  const [destination, setDestination] = useState("JFK Airport → Manhattan");
  const [schedule, setSchedule] = useState("2026-11-25T10:00");
  const [dynamicDetails, setDynamicDetails] = useState("2 passengers · 2 suitcases");
  const [customerNotes, setCustomerNotes] = useState("Meet at arrivals with name sign");
  const [currency, setCurrency] = useState("USD");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const custs = customerRepository.listCustomers({ pageSize: 50 });
    setCustomers(custs.items);
  }, []);

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (serviceId === "srv_airport") {
      setVendorService("Executive Sedan Pickup");
      setDestination("JFK Airport → Manhattan");
      setDynamicDetails("2 passengers · 2 suitcases");
    } else if (serviceId === "srv_chef") {
      setVendorService("French Haute Cuisine Dinner");
      setDestination("Meadow Lane Estate, Southampton");
      setDynamicDetails("4 guests · 5 course tasting");
    } else if (serviceId === "srv_yacht") {
      setVendorService("Hudson River Sunset Cruise");
      setDestination("Chelsea Piers Pier 59");
      setDynamicDetails("4 hours · 6 guests");
    } else if (serviceId === "srv_dining") {
      setVendorService("Chef's Table VIP Reservation");
      setDestination("Le Bernardin, Midtown");
      setDynamicDetails("2 guests · Window seating");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage("Please select a customer.");
      return;
    }
    if (!destination.trim()) {
      setErrorMessage("Destination is required.");
      return;
    }
    if (!schedule) {
      setErrorMessage("Schedule date and time are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newBooking = bookingRepository.createBooking({
        customerId: selectedCustomerId,
        serviceId: selectedServiceId,
        vendorServiceId: vendorService,
        tripId: tripId.trim() || undefined,
        destination: destination.trim(),
        schedule,
        dynamicFields: {
          details: dynamicDetails,
        },
        customerNotes: customerNotes.trim() || undefined,
        currency,
      });

      router.push(`/bookings/${newBooking.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while creating booking.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1140px] w-full"
        data-node-id="81:450"
        data-name="CC-BKG-03__Concierge__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/bookings"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Bookings List
          </Link>
        </div>

        {/* Page Title & Subtitle */}
        <div className="mb-[20px]">
          <h1
            className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
            data-node-id="81:486"
          >
            Create Booking on Behalf
          </h1>
          <p className="text-[14px] text-[#5B616B] mt-[4px]">
            Concierge-assisted booking intake & reservation management
          </p>
        </div>

        {/* Info Notice Banner */}
        <div className="bg-[#EEE9E0] border border-[#DDD8CF] rounded-[10px] p-[16px] mb-[28px] text-[13px] text-[#5B616B] leading-[20px]">
          Uses the same booking, availability and pricing rules as the Customer flow. No client-side
          booking_mode or arbitrary payment amount override.
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-[20px] p-[16px] bg-[#FEECEC] border border-[#FCA5A5] rounded-[10px] text-[14px] text-[#991B1B]">
            {errorMessage}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} noValidate className="space-y-[24px]">
          <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card space-y-[20px]">
            {/* Grid 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              {/* Field 1: Customer */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] flex items-center gap-[8px] border-b border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_482dab7b-dd1.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <label
                    htmlFor="customer-select"
                    className="text-[13px] font-semibold text-[#5B616B]"
                  >
                    Customer
                  </label>
                </div>
                <select
                  id="customer-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full h-[40px] px-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.membershipTier} · {c.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2: Service */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] flex items-center gap-[8px] border-b border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_c0e81ce8-cde.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <label
                    htmlFor="service-select"
                    className="text-[13px] font-semibold text-[#5B616B]"
                  >
                    Service
                  </label>
                </div>
                <select
                  id="service-select"
                  value={selectedServiceId}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full h-[40px] px-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none cursor-pointer"
                >
                  <option value="srv_airport">Airport Transfer · JFK</option>
                  <option value="srv_chef">Private Chef · Hamptons</option>
                  <option value="srv_yacht">Yacht Charter · Hudson</option>
                  <option value="srv_dining">Fine Dining · Manhattan</option>
                </select>
              </div>

              {/* Field 3: Vendor Service */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] flex items-center gap-[8px] border-b border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_2481db27-ba1.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <label
                    htmlFor="vendor-service-input"
                    className="text-[13px] font-semibold text-[#5B616B]"
                  >
                    Vendor service
                  </label>
                </div>
                <input
                  id="vendor-service-input"
                  type="text"
                  value={vendorService}
                  onChange={(e) => setVendorService(e.target.value)}
                  className="w-full h-[40px] px-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none"
                />
              </div>

              {/* Field 4: Trip Context */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] flex items-center gap-[8px] border-b border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_7232e11f-15f.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <label
                    htmlFor="trip-id-input"
                    className="text-[13px] font-semibold text-[#5B616B]"
                  >
                    Trip (optional context)
                  </label>
                </div>
                <input
                  id="trip-id-input"
                  type="text"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  placeholder="e.g. TRIP-261124-04"
                  className="w-full h-[40px] px-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none"
                />
              </div>

              {/* Field 5: Destination */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] flex items-center gap-[8px] border-b border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_37e8b0e5-6f2.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <label
                    htmlFor="destination-input"
                    className="text-[13px] font-semibold text-[#5B616B]"
                  >
                    Destination
                  </label>
                </div>
                <input
                  id="destination-input"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-[40px] px-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none"
                />
              </div>

              {/* Field 6: Schedule */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] flex items-center gap-[8px] border-b border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_44c91923-41f.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <label
                    htmlFor="schedule-input"
                    className="text-[13px] font-semibold text-[#5B616B]"
                  >
                    Schedule date & time
                  </label>
                </div>
                <input
                  id="schedule-input"
                  type="datetime-local"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full h-[40px] px-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none cursor-pointer"
                />
              </div>

              {/* Field 7: Dynamic fields */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] flex items-center gap-[8px] border-b border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_e14fd1d0-339.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <label
                    htmlFor="dynamic-details-input"
                    className="text-[13px] font-semibold text-[#5B616B]"
                  >
                    Dynamic booking fields
                  </label>
                </div>
                <input
                  id="dynamic-details-input"
                  type="text"
                  value={dynamicDetails}
                  onChange={(e) => setDynamicDetails(e.target.value)}
                  className="w-full h-[40px] px-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none"
                />
              </div>

              {/* Field 8: Display currency */}
              <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
                <div className="bg-[#f4eddf] px-[12px] py-[6px] flex items-center gap-[8px] border-b border-[#ded6c9]">
                  <Image
                    src="/figma-assets/bkg_f7a61b0c-1f6.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-75"
                  />
                  <label
                    htmlFor="currency-select"
                    className="text-[13px] font-semibold text-[#5B616B]"
                  >
                    Display currency
                  </label>
                </div>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-[40px] px-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Field 9: Customer Notes */}
            <div className="border border-[#ded6c9] rounded-[9px] overflow-hidden">
              <div className="bg-[#f4eddf] px-[12px] py-[6px] flex items-center gap-[8px] border-b border-[#ded6c9]">
                <Image
                  src="/figma-assets/bkg_b9552bdd-5c0.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="opacity-75"
                />
                <label
                  htmlFor="customer-notes-input"
                  className="text-[13px] font-semibold text-[#5B616B]"
                >
                  Customer notes
                </label>
              </div>
              <textarea
                id="customer-notes-input"
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full p-[12px] bg-transparent text-[14px] text-[#0B0C0E] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-[16px]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[48px] px-[24px] bg-[#0B0C0E] hover:bg-[#17191D] border-[1.2px] border-[#B48737] rounded-[12px] text-white text-[14px] font-semibold flex items-center justify-center transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              data-node-id="81:490"
            >
              {isSubmitting ? "Creating..." : "Create booking / request"}
            </button>

            <Link
              href="/bookings"
              className="h-[48px] px-[24px] bg-white hover:bg-[#FAF8F4] border border-[#A6A19A] rounded-[12px] text-[#0B0C0E] text-[14px] font-semibold flex items-center justify-center transition-colors cursor-pointer"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Scope Guard Bottom Card */}
        <div
          className="mt-[28px] bg-[#f1e7d3] border border-[#ddd8cf] rounded-[12px] p-[20px] relative overflow-hidden flex items-start gap-[16px] shadow-xs"
          data-node-id="81:498"
        >
          <div className="w-[24px] h-[24px] shrink-0 mt-[2px] opacity-80">
            <Image src="/figma-assets/bkg_b032f883-5f7.svg" alt="" width={24} height={24} />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-[#0B0C0E] mb-[6px]">Scope guard</h3>
            <p className="text-[14px] font-normal leading-[22px] text-[#5B616B]">
              No create/delete controls and no phone verification, password or recovery controls.
              Only the approved Customer admin projection is shown.
            </p>
          </div>
        </div>
      </div>
    </CommandCenterShell>
  );
}
