"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { AssetValidationError, assetRepository } from "@/lib/mock/assets";
import { vendorRepository } from "@/lib/mock/vendors";
import type { Asset, AssetOwnerType, AssetStatus } from "@/types/asset";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

interface AssetFormProps {
  initialData?: Asset | null;
  mode: "create" | "edit";
  assetId?: string;
}

export function AssetForm({ initialData, mode, assetId }: AssetFormProps) {
  const router = useRouter();
  const { user } = useSession();

  const vendors = vendorRepository.listVendors();

  // If vendor persona, lock ownerType to VENDOR and vendorId to user.vendorId
  const isVendorPersona = user?.role === "VENDOR";

  const [ownerType, setOwnerType] = useState<AssetOwnerType>(
    initialData?.ownerType || (isVendorPersona ? "VENDOR" : "XTREME"),
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    initialData?.vendorId ||
      (isVendorPersona ? user?.vendorId || "vnd_aerojet_99" : "vnd_aerojet_99"),
  );
  const [name, setName] = useState(initialData?.name || "");
  const [code, setCode] = useState(initialData?.code || "");
  const [destination, setDestination] = useState(initialData?.destination || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [capacity, setCapacity] = useState<string>(
    initialData?.capacity !== undefined ? String(initialData.capacity) : "6",
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState<AssetStatus>(initialData?.status || "ACTIVE");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operationalNotice, setOperationalNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setOperationalNotice(null);

    if (!name.trim()) {
      setErrorMessage("Asset display name is required.");
      return;
    }
    if (!code.trim()) {
      setErrorMessage("Internal asset code is required.");
      return;
    }
    const capNum = Number(capacity);
    if (Number.isNaN(capNum) || capNum <= 0) {
      setErrorMessage("Configured capacity must be a positive number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

      if (mode === "create") {
        const created = assetRepository.createAsset({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          destination: destination.trim() || "Global / Unassigned",
          category: category.trim() || "Charter Asset",
          capacity: capNum,
          status,
          ownerType: isVendorPersona ? "VENDOR" : ownerType,
          vendorId:
            (isVendorPersona ? "VENDOR" : ownerType) === "VENDOR" ? selectedVendorId : undefined,
          vendorName:
            (isVendorPersona ? "VENDOR" : ownerType) === "VENDOR"
              ? selectedVendor?.displayName || "Vendor Organization"
              : "XTREME Fleet",
          description: description.trim(),
        });

        setSuccessMessage(`Asset "${created.name}" created successfully.`);
        setTimeout(() => {
          router.push(`/assets/${created.id}`);
        }, 500);
      } else if (assetId) {
        const result = assetRepository.updateAsset(assetId, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          destination: destination.trim(),
          category: category.trim(),
          capacity: capNum,
          status,
          ownerType: isVendorPersona ? "VENDOR" : ownerType,
          vendorId:
            (isVendorPersona ? "VENDOR" : ownerType) === "VENDOR" ? selectedVendorId : undefined,
          vendorName:
            (isVendorPersona ? "VENDOR" : ownerType) === "VENDOR"
              ? selectedVendor?.displayName || "Vendor Organization"
              : "XTREME Fleet",
          description: description.trim(),
        });

        if (result.operationalNotice) {
          setOperationalNotice(result.operationalNotice);
        }

        setSuccessMessage(`Asset "${result.asset.name}" updated successfully.`);
        setTimeout(() => {
          router.push(`/assets/${result.asset.id}`);
        }, 600);
      }
    } catch (err) {
      if (err instanceof AssetValidationError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving asset.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="86:2320"
        data-name="CC-AST-03__Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/assets"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Assets
          </Link>
        </div>

        {/* Header (Figma Node 86:2359) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="86:2359"
            >
              Create / Edit Asset
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-AST-03 (Node 86:2320) ·{" "}
              {mode === "create" ? "New Asset Registration" : `Editing: ${initialData?.name}`}
            </p>
          </div>
        </div>

        {/* Error / Success / Operational Alerts */}
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
        {operationalNotice && (
          <div className="mb-[24px] p-4 bg-[#FEF08A] border border-[#FACC15] rounded-[10px] text-[#854D0E] text-[14px] font-semibold">
            {operationalNotice}
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
          className="bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card space-y-[24px] mb-[20px]"
        >
          {/* Row 1: Selection (86:2360) Owner Type / Vendor & Input (86:2366) Display Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div data-node-id="86:2360">
              <label
                htmlFor="asset-owner-type"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Owner Type / Vendor Organization <span className="text-[#DC2626]">*</span>
              </label>
              {isVendorPersona ? (
                <div className="h-[48px] px-3.5 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[8px] flex items-center text-[14px] text-[#0B0C0E] font-medium">
                  Vendor Owned (Scoped to Authenticated Organization)
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    id="asset-owner-type"
                    value={ownerType}
                    onChange={(e) => setOwnerType(e.target.value as AssetOwnerType)}
                    className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                  >
                    <option value="XTREME">XTREME Fleet</option>
                    <option value="VENDOR">Vendor Organization</option>
                  </select>
                  {ownerType === "VENDOR" ? (
                    <select
                      id="asset-vendor-id"
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.displayName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="h-[48px] px-3.5 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[8px] flex items-center text-[13px] text-[#5B616B]">
                      Internal fleet asset
                    </div>
                  )}
                </div>
              )}
              <p className="text-[12px] text-[#5B616B] mt-1">
                Designates operational owner and governance boundary.
              </p>
            </div>

            <div data-node-id="86:2366">
              <label
                htmlFor="asset-display-name"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Asset Display Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="asset-display-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Required • e.g. Cessna Citation Latitude"
                maxLength={180}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Public catalogue title and client manifest display.
              </p>
            </div>
          </div>

          {/* Row 2: Input (86:2371) Internal Code & Input (86:2376) Destination / Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div data-node-id="86:2371">
              <label
                htmlFor="asset-code"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Internal Asset Code <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="asset-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Unique code (e.g. AST-AJ-01)"
                maxLength={60}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] font-mono uppercase text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Unique identifier across inventory and dispatch logs.
              </p>
            </div>

            <div data-node-id="86:2376">
              <label
                htmlFor="asset-destination"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Destination / Operating Area <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="asset-destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Nice / Cannes / Monaco"
                maxLength={180}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Primary geographical hub or operational home port.
              </p>
            </div>
          </div>

          {/* Row 3: Input (86:2381) Category & Input (86:2386) Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div data-node-id="86:2381">
              <label
                htmlFor="asset-category"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Asset Type / Category
              </label>
              <input
                id="asset-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Light Jet, Superyacht, Helicopter, Luxury Sedan"
                maxLength={100}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Physical classification for search indexing and pricing tiers.
              </p>
            </div>

            <div data-node-id="86:2386">
              <label
                htmlFor="asset-capacity"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Capacity (Configured Passengers) <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="asset-capacity"
                type="number"
                min="1"
                max="500"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 8"
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Maximum certified passenger capacity without crew.
              </p>
            </div>
          </div>

          {/* Row 4: Input (86:2391) Description & Selection (86:2396) Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div data-node-id="86:2391">
              <label
                htmlFor="asset-description"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Description / Notes
              </label>
              <input
                id="asset-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional asset specifications, amenities, or maintenance history"
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
              <p className="text-[12px] text-[#5B616B] mt-1">
                Internal operational notes and special instructions.
              </p>
            </div>

            <div data-node-id="86:2396">
              <label
                htmlFor="asset-status"
                className="block text-[14px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Status <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="asset-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full h-[48px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ACTIVE">ACTIVE · Available for allocations &amp; bookings</option>
                <option value="MAINTENANCE">
                  MAINTENANCE · In servicing / blocks new allocations
                </option>
                <option value="INACTIVE">INACTIVE · Decommissioned / drydock</option>
              </select>
              <p className="text-[12px] text-[#5B616B] mt-1">
                Blocks new allocations when MAINTENANCE or INACTIVE.
              </p>
            </div>
          </div>

          {/* Buttons: Primary (86:2402) & Secondary (86:2404) */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[48px] min-w-[180px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] disabled:opacity-50 transition-colors inline-flex items-center justify-center shadow-sm"
              data-node-id="86:2402"
            >
              {isSubmitting ? "Saving asset..." : "Save asset"}
            </button>
            <button
              type="button"
              onClick={() => router.push(initialData ? `/assets/${initialData.id}` : "/assets")}
              className="h-[48px] min-w-[160px] px-[24px] bg-white border border-[#DDD8CF] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] transition-colors inline-flex items-center justify-center shadow-sm"
              data-node-id="86:2404"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Footnote (Figma Node 86:2406) */}
        <p className="text-[12px] text-[#5B616B]" data-node-id="86:2406">
          Changing status never silently cancels an existing confirmed booking.
        </p>
      </div>
    </CommandCenterShell>
  );
}
