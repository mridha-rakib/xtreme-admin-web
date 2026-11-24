"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { VendorValidationError, vendorRepository } from "@/lib/mock/vendors";
import type { VendorOrganization, VendorOrganizationStatus } from "@/types/vendor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

interface VendorFormProps {
  initialData?: VendorOrganization | null;
  mode: "create" | "edit";
  vendorId?: string;
}

export function VendorForm({ initialData, mode, vendorId }: VendorFormProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initialData?.displayName || "");
  const [legalName, setLegalName] = useState(initialData?.legalName || "");
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone || "");
  const [status, setStatus] = useState<VendorOrganizationStatus>(initialData?.status || "ACTIVE");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!displayName.trim()) {
      setErrorMessage("Display name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const created = vendorRepository.createVendor({
          displayName: displayName.trim(),
          legalName: legalName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          status,
        });

        setSuccessMessage(`Vendor organization "${created.displayName}" created successfully.`);
        setTimeout(() => {
          router.push(`/vendors/${created.id}`);
        }, 500);
      } else if (vendorId) {
        const updated = vendorRepository.updateVendor(vendorId, {
          displayName: displayName.trim(),
          legalName: legalName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          status,
        });

        setSuccessMessage(`Vendor organization "${updated.displayName}" updated successfully.`);
        setTimeout(() => {
          router.push(`/vendors/${updated.id}`);
        }, 500);
      }
    } catch (err) {
      if (err instanceof VendorValidationError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving vendor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="86:1846"
        data-name="CC-VEN-03__Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/vendors"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Vendors
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="86:1885"
            >
              Create / Edit Vendor
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-VEN-03 (Node 86:1846) ·{" "}
              {mode === "create"
                ? "New Organization Onboarding"
                : `Edit Context: ${initialData?.displayName}`}
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
          {/* Row 1: Display Name & Legal Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="vendor-display-name"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Display name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="vendor-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Required • max 180"
                maxLength={180}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Public facing organization identity.
              </p>
            </div>

            <div>
              <label
                htmlFor="vendor-legal-name"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Legal name
              </label>
              <input
                id="vendor-legal-name"
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Optional • max 220"
                maxLength={220}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Corporate entity registration for contracts.
              </p>
            </div>
          </div>

          {/* Row 2: Contact Email & Contact Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="vendor-contact-email"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Contact email
              </label>
              <div className="relative">
                <input
                  id="vendor-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Optional email"
                  className="w-full h-[48px] pl-3.5 pr-10 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                />
                <span className="absolute right-3.5 top-3.5 text-[#5B616B] pointer-events-none text-base">
                  ✉
                </span>
              </div>
              <p className="text-[12px] text-[#5B616B] mt-1">Primary operational dispatch inbox.</p>
            </div>

            <div>
              <label
                htmlFor="vendor-contact-phone"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Contact phone
              </label>
              <div className="relative">
                <input
                  id="vendor-contact-phone"
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Optional E.164 (e.g. +12125550190)"
                  className="w-full h-[48px] pl-3.5 pr-10 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                />
                <span className="absolute right-3.5 top-3.5 text-[#5B616B] pointer-events-none text-base">
                  ☎
                </span>
              </div>
              <p className="text-[12px] text-[#5B616B] mt-1">
                E.164 international format with country code.
              </p>
            </div>
          </div>

          {/* Row 3: Status Selection & Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label
                htmlFor="vendor-status-select"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Status
              </label>
              <select
                id="vendor-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorOrganizationStatus)}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <p className="text-[12px] text-[#5B616B] mt-1">
                Operational dispatch availability status.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-[48px] px-[28px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <Link
                href="/vendors"
                className="h-[48px] px-[24px] bg-white border border-[#A6A19A] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] transition-colors inline-flex items-center"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Footer Caption */}
          <div className="pt-2 border-t border-[#DDD8CF]">
            <p className="text-[12px] text-[#5B616B]" data-node-id="86:1916">
              Admin capability remains effective-permission dependent.
            </p>
          </div>
        </form>
      </div>
    </CommandCenterShell>
  );
}
