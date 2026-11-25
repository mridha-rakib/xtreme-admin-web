"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import {
  UnauthorizedStaffAccessError,
  VendorStaffValidationError,
  vendorStaffRepository,
} from "@/lib/mock/vendor-staff";
import { vendorRepository } from "@/lib/mock/vendors";
import {
  APPROVED_VENDOR_STAFF_TYPES,
  type OperationalIdentity,
  type VendorStaff,
  type VendorStaffType,
} from "@/types/vendor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

interface VendorStaffFormProps {
  initialData?: VendorStaff | null;
  mode: "create" | "edit";
  staffId?: string;
}

export function VendorStaffForm({ initialData, mode, staffId }: VendorStaffFormProps) {
  const router = useRouter();
  const { user } = useSession();

  // Scoped vendorId
  const effectiveVendorId =
    initialData?.vendorId ||
    user?.vendorId ||
    (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? "vnd_aerojet_99" : "");

  const vendorOrg =
    effectiveVendorId && user ? vendorRepository.getVendorById(user, effectiveVendorId) : null;
  const vendorName = vendorOrg?.displayName || "Vendor Organization";

  const [identities, setIdentities] = useState<OperationalIdentity[]>([]);
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>(
    initialData?.identityId || "",
  );
  const [employeeCode, setEmployeeCode] = useState(initialData?.employeeCode || "");
  const [staffType, setStaffType] = useState<VendorStaffType>(initialData?.staffType || "OPS");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [active, setActive] = useState<boolean>(initialData?.active ?? true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && mode === "create") {
      try {
        const pool = vendorStaffRepository.listEligibleIdentities(user);
        setIdentities(pool);
        if (pool.length > 0 && !selectedIdentityId) {
          setSelectedIdentityId(pool[0].id);
        }
      } catch (err) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        }
      }
    }
  }, [user, mode, selectedIdentityId]);

  const selectedIdentity = useMemo(() => {
    if (mode === "create") {
      return identities.find((i) => i.id === selectedIdentityId);
    }
    return {
      id: initialData?.identityId || "",
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      eligibleRoles: [initialData?.staffType || "OPS"],
    };
  }, [mode, identities, selectedIdentityId, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user) {
      setErrorMessage("Authentication session required.");
      return;
    }

    if (!employeeCode.trim()) {
      setErrorMessage("Employee code is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        if (!effectiveVendorId) {
          throw new VendorStaffValidationError("A vendor scope is required to associate staff.");
        }
        if (!selectedIdentityId) {
          throw new VendorStaffValidationError(
            "Please select an operational identity to associate.",
          );
        }

        const created = vendorStaffRepository.associateStaff(user, {
          identityId: selectedIdentityId,
          vendorId: effectiveVendorId,
          staffType,
          employeeCode: employeeCode.trim(),
          active,
        });

        setSuccessMessage(`Staff member "${created.name}" associated successfully.`);
        setTimeout(() => {
          router.push("/vendor/staff");
        }, 500);
      } else if (staffId) {
        const updated = vendorStaffRepository.updateStaff(user, staffId, {
          staffType,
          employeeCode: employeeCode.trim(),
          phone: phone.trim() || undefined,
          active,
        });

        setSuccessMessage(`Staff member "${updated.name}" updated successfully.`);
        setTimeout(() => {
          router.push("/vendor/staff");
        }, 500);
      }
    } catch (err) {
      if (
        err instanceof VendorStaffValidationError ||
        err instanceof UnauthorizedStaffAccessError
      ) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving staff association.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="86:2078"
        data-name="CC-VEN-06__Vendor__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/vendor/staff"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Vendor Staff
          </Link>
        </div>

        {/* Header (Figma Node 86:2117) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="86:2117"
            >
              Associate / Manage Vendor Staff
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Organization: {vendorName} (Scoped Workspace)
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
          className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card space-y-[24px] mb-[24px]"
        >
          {/* Row 1: Identity / Name / Code (Node 86:2118) & Staff Role / Type (Node 86:2123) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div data-node-id="86:2118">
              <label
                htmlFor="staff-identity"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Operational Identity <span className="text-[#DC2626]">*</span>
              </label>
              {mode === "create" ? (
                <div className="space-y-2">
                  <select
                    id="staff-identity"
                    value={selectedIdentityId}
                    onChange={(e) => setSelectedIdentityId(e.target.value)}
                    className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                  >
                    {identities.map((ident) => (
                      <option key={ident.id} value={ident.id}>
                        {ident.name} ({ident.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[12px] text-[#5B616B]">
                    Pre-registered verified operational identities directory.
                  </p>
                </div>
              ) : (
                <div className="h-[48px] px-3.5 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[8px] flex items-center text-[14px] font-semibold text-[#0B0C0E]">
                  {selectedIdentity?.name || initialData?.name}
                </div>
              )}
            </div>

            <div data-node-id="86:2123">
              <label
                htmlFor="staff-type"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Staff Role / Type <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="staff-type"
                value={staffType}
                onChange={(e) => setStaffType(e.target.value as VendorStaffType)}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                {APPROVED_VENDOR_STAFF_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p className="text-[12px] text-[#5B616B] mt-1">
                Designates operational role and scheduling eligibility.
              </p>
            </div>
          </div>

          {/* Row 2: Employee Code & Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="staff-code"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Employee Code <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="staff-code"
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Employee Code (e.g. AJ-1042)"
                maxLength={50}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] font-mono text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Vendor internal operational identifier (must be unique per vendor).
              </p>
            </div>

            <div data-node-id="86:2129">
              <label
                htmlFor="staff-email"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Canonical Email / Contact
              </label>
              <input
                id="staff-email"
                type="email"
                readOnly
                value={selectedIdentity?.email || initialData?.email || ""}
                className="w-full h-[48px] px-3.5 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#5B616B] cursor-not-allowed"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Verified canonical email from identity provider.
              </p>
            </div>
          </div>

          {/* Row 3: Phone (Edit mode) & Active Status (Node 86:2134) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="staff-phone"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Operational Phone
              </label>
              <input
                id="staff-phone"
                type="text"
                value={mode === "create" ? selectedIdentity?.phone || "" : phone}
                readOnly={mode === "create"}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+12125550142"
                className={`w-full h-[48px] px-3.5 border border-[#DDD8CF] rounded-[8px] text-[14px] ${
                  mode === "create"
                    ? "bg-[#FAF8F4] text-[#5B616B] cursor-not-allowed"
                    : "bg-white text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                }`}
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Direct dispatch voice &amp; SMS coordination line.
              </p>
            </div>

            <div data-node-id="86:2134">
              <label
                htmlFor="staff-active"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Active Status
              </label>
              <select
                id="staff-active"
                value={active ? "yes" : "no"}
                onChange={(e) => setActive(e.target.value === "yes")}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="yes">Yes · Active and available for assignments</option>
                <option value="no">No · Inactive / on leave</option>
              </select>
              <p className="text-[12px] text-[#5B616B] mt-1">
                Controls visibility in dispatch assignment pickers.
              </p>
            </div>
          </div>

          {/* Action Buttons: Button/Primary (86:2140) & Button/Secondary (86:2142) */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[48px] min-w-[220px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] disabled:opacity-50 transition-colors inline-flex items-center justify-center shadow-sm"
              data-node-id="86:2140"
            >
              {isSubmitting ? "Saving changes..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/vendor/staff")}
              className="h-[48px] min-w-[160px] px-[24px] bg-white border border-[#DDD8CF] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] transition-colors inline-flex items-center justify-center shadow-sm"
              data-node-id="86:2142"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Scope Rule Card (Figma Node 86:2144) */}
        <div
          className="bg-[#FAF8F4] border border-[#DDD8CF] rounded-[12px] p-[20px]"
          data-node-id="86:2144"
        >
          <h2 className="text-[16px] font-bold text-[#0B0C0E] mb-[8px]" data-node-id="86:2145">
            Scope rule
          </h2>
          <p className="text-[14px] text-[#5B616B] leading-[22px]" data-node-id="86:2146">
            Associates or updates Vendor-linked operational Staff within the authenticated
            Vendor&apos;s own scope. This does not provision arbitrary Customer accounts.
          </p>
        </div>
      </div>
    </CommandCenterShell>
  );
}
