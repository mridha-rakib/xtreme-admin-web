"use client";

import { useSession } from "@/lib/auth/session";
import { assetRepository } from "@/lib/mock/assets";
import { availabilityExceptionRepository } from "@/lib/mock/availability-exceptions";
import {
  APPROVED_EXCEPTION_TYPES,
  type AvailabilityException,
  type AvailabilityExceptionType,
} from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

interface AvailabilityExceptionFormProps {
  initialException?: AvailabilityException;
  isEdit?: boolean;
}

export function AvailabilityExceptionForm({
  initialException,
  isEdit = false,
}: AvailabilityExceptionFormProps) {
  const router = useRouter();
  const { user } = useSession();

  const [target, setTarget] = useState(initialException?.target || "");
  const [targetId, setTargetId] = useState(initialException?.targetId || "");
  const [startsAt, setStartsAt] = useState(
    initialException?.startsAt
      ? initialException.startsAt.substring(0, 16)
      : new Date().toISOString().substring(0, 16),
  );
  const [endsAt, setEndsAt] = useState(
    initialException?.endsAt
      ? initialException.endsAt.substring(0, 16)
      : new Date(Date.now() + 24 * 3600 * 1000).toISOString().substring(0, 16),
  );
  const [type, setType] = useState<AvailabilityExceptionType>(
    initialException?.type || "UNAVAILABLE",
  );
  const [capacityOverride, setCapacityOverride] = useState<number | string>(
    initialException?.capacityOverride ?? "",
  );
  const [reason, setReason] = useState(initialException?.reason || "");

  const [availableAssets, setAvailableAssets] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const vendorId = user.role === "VENDOR" ? user.vendorId : undefined;
      const assets = assetRepository.listAssets(user, { vendorId, status: "ACTIVE" });
      setAvailableAssets(assets.map((a) => ({ id: a.id, name: a.name, code: a.code })));
    } catch {
      setAvailableAssets([]);
    }
  }, [user]);

  const handleAssetSelect = (assetId: string) => {
    setTargetId(assetId);
    const found = availableAssets.find((a) => a.id === assetId);
    if (found) {
      setTarget(`${found.name} (${found.code})`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Authentication required: Actor context missing.");
      return;
    }

    const cleanTarget = target.trim();
    if (!cleanTarget) {
      setError("Target asset or category is required.");
      return;
    }

    if (!startsAt || !endsAt) {
      setError("Start date/time and end date/time are required.");
      return;
    }
    if (startsAt >= endsAt) {
      setError(`Start date/time (${startsAt}) must precede end date/time (${endsAt}).`);
      return;
    }

    let capOverrideVal: number | undefined;
    if (type === "CAPACITY_OVERRIDE") {
      const parsed =
        typeof capacityOverride === "number"
          ? capacityOverride
          : Number.parseInt(String(capacityOverride), 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        setError("Capacity override must be a non-negative number when type is CAPACITY_OVERRIDE.");
        return;
      }
      capOverrideVal = parsed;
    }

    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError("Reason is required for an availability exception.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Normalize to ISO-like string
      const isoStart = startsAt.includes("Z") ? startsAt : `${startsAt}:00Z`;
      const isoEnd = endsAt.includes("Z") ? endsAt : `${endsAt}:00Z`;

      if (isEdit && initialException) {
        availabilityExceptionRepository.updateException(user, initialException.id, {
          target: cleanTarget,
          targetId: targetId || undefined,
          startsAt: isoStart,
          endsAt: isoEnd,
          type,
          capacityOverride: capOverrideVal,
          reason: cleanReason,
        });
      } else {
        availabilityExceptionRepository.createException(user, {
          target: cleanTarget,
          targetId: targetId || undefined,
          startsAt: isoStart,
          endsAt: isoEnd,
          type,
          capacityOverride: capOverrideVal,
          reason: cleanReason,
        });
      }

      router.push("/availability/exceptions");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save availability exception.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="p-[32px] max-w-[1280px] w-full"
      data-node-id="88:2532"
      data-name="CC-AVL-04__Admin__Ready"
    >
      {/* Title */}
      <div className="mb-[24px]">
        <h1
          className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
          data-node-id="88:2571"
        >
          {isEdit ? "Edit Availability Exception" : "Create / Edit Availability Exception"}
        </h1>
        <p className="text-[14px] text-[#5B616B] mt-[4px]">
          Configure blackout periods, maintenance schedules, or approved operational overrides.
        </p>
      </div>

      {error && (
        <div className="mb-[24px] p-4 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] text-[#B42318] text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-[#B42318] font-bold text-sm ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-6 shadow-card space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Input */}
            <div data-node-id="88:2572">
              <label
                htmlFor="target-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Target Asset or Fleet Category *
              </label>
              {availableAssets.length > 0 && (
                <div className="mb-2">
                  <select
                    id="select-asset"
                    value={targetId}
                    onChange={(e) => handleAssetSelect(e.target.value)}
                    className="w-full h-[40px] px-3 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                  >
                    <option value="">-- Choose from registered assets --</option>
                    {availableAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <input
                id="target-input"
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. Sunseeker Predator 74 (AST-CY-01)"
                required
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            {/* Starts At (DateTime) */}
            <div data-node-id="88:2577">
              <label
                htmlFor="starts-at-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Starts At (Date &amp; Time) *
              </label>
              <input
                id="starts-at-input"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            {/* Ends At (DateTime) */}
            <div data-node-id="88:2583">
              <label
                htmlFor="ends-at-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Ends At (Date &amp; Time) *
              </label>
              <input
                id="ends-at-input"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            {/* Exception Type (Selection) */}
            <div data-node-id="88:2589">
              <label
                htmlFor="exception-type-select"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Exception Type *
              </label>
              <select
                id="exception-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as AvailabilityExceptionType)}
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                {APPROVED_EXCEPTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Capacity Override */}
            <div data-node-id="88:2595">
              <label
                htmlFor="capacity-override-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Capacity Override {type === "CAPACITY_OVERRIDE" && "*"}
              </label>
              <input
                id="capacity-override-input"
                type="number"
                min="0"
                max="500"
                value={capacityOverride}
                onChange={(e) => setCapacityOverride(e.target.value)}
                disabled={type !== "CAPACITY_OVERRIDE"}
                placeholder={type === "CAPACITY_OVERRIDE" ? "e.g. 6" : "Only for CAPACITY_OVERRIDE"}
                className={`w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E] ${
                  type !== "CAPACITY_OVERRIDE"
                    ? "bg-[#FAF8F4] text-[#8C939F] cursor-not-allowed"
                    : ""
                }`}
              />
            </div>

            {/* Reason */}
            <div data-node-id="88:2600">
              <label
                htmlFor="reason-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Operational Reason *
              </label>
              <input
                id="reason-input"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Scheduled 100h engine inspection &amp; drydock"
                required
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>
          </div>
        </div>

        {/* Buttons (Figma Node 88:2605 & 88:2607) */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[48px] px-8 bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
            data-node-id="88:2605"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Save Exception Changes" : "Save Exception"}
          </button>

          <Link
            href="/availability/exceptions"
            className="h-[48px] px-6 bg-white border border-[#DDD8CF] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] inline-flex items-center justify-center transition-colors"
            data-node-id="88:2607"
          >
            Cancel
          </Link>
        </div>

        {/* Footnote (Figma Node 88:2609) */}
        <p className="text-[12px] text-[#5B616B] mt-4" data-node-id="88:2609">
          AVAILABLE_OVERRIDE never bypasses an active allocation conflict.
        </p>
      </form>
    </div>
  );
}
