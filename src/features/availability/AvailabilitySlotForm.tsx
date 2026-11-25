"use client";

import { useSession } from "@/lib/auth/session";
import { assetRepository } from "@/lib/mock/assets";
import { availabilitySlotRepository } from "@/lib/mock/availability-slots";
import {
  APPROVED_SLOT_STATUSES,
  type AvailabilitySlot,
  type AvailabilitySlotStatus,
} from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

interface AvailabilitySlotFormProps {
  initialSlot?: AvailabilitySlot;
  isEdit?: boolean;
}

export function AvailabilitySlotForm({ initialSlot, isEdit = false }: AvailabilitySlotFormProps) {
  const router = useRouter();
  const { user } = useSession();

  const [target, setTarget] = useState(initialSlot?.target || "");
  const [targetId, setTargetId] = useState(initialSlot?.targetId || "");
  const [startsAt, setStartsAt] = useState(
    initialSlot?.startsAt
      ? initialSlot.startsAt.substring(0, 16)
      : new Date().toISOString().substring(0, 16),
  );
  const [endsAt, setEndsAt] = useState(
    initialSlot?.endsAt
      ? initialSlot.endsAt.substring(0, 16)
      : new Date(Date.now() + 4 * 3600 * 1000).toISOString().substring(0, 16),
  );
  const [capacity, setCapacity] = useState<number | string>(initialSlot?.capacity ?? 8);
  const [status, setStatus] = useState<AvailabilitySlotStatus>(initialSlot?.status || "OPEN");
  const [notes, setNotes] = useState(initialSlot?.notes || "");

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

    const capNum = typeof capacity === "number" ? capacity : Number.parseInt(String(capacity), 10);
    if (Number.isNaN(capNum) || capNum <= 0) {
      setError("Capacity must be a positive integer greater than zero.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isoStart = startsAt.includes("Z") ? startsAt : `${startsAt}:00Z`;
      const isoEnd = endsAt.includes("Z") ? endsAt : `${endsAt}:00Z`;

      if (isEdit && initialSlot) {
        availabilitySlotRepository.updateSlot(user, initialSlot.id, {
          target: cleanTarget,
          targetId: targetId || undefined,
          startsAt: isoStart,
          endsAt: isoEnd,
          capacity: capNum,
          status,
          notes,
        });
      } else {
        availabilitySlotRepository.createSlot(user, {
          target: cleanTarget,
          targetId: targetId || undefined,
          startsAt: isoStart,
          endsAt: isoEnd,
          capacity: capNum,
          status,
          notes,
        });
      }

      router.push("/availability/slots");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save availability slot.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="p-[32px] max-w-[1280px] w-full"
      data-node-id="88:2710"
      data-name="CC-AVL-06__Admin__Ready"
    >
      {/* Title */}
      <div className="mb-[24px]">
        <h1
          className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
          data-node-id="88:2749"
        >
          {isEdit ? "Edit Availability Slot" : "Create / Edit Availability Slot"}
        </h1>
        <p className="text-[14px] text-[#5B616B] mt-[4px]">
          Define discrete dispatchable operational slots with capacity limits and status boundaries.
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
            <div data-node-id="88:2750">
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
                placeholder="e.g. Cessna Citation Latitude (AST-AJ-01)"
                required
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            {/* Starts At (DateTime) */}
            <div data-node-id="88:2755">
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
            <div data-node-id="88:2761">
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

            {/* Capacity Input */}
            <div data-node-id="88:2767">
              <label
                htmlFor="capacity-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Slot Capacity (pax) *
              </label>
              <input
                id="capacity-input"
                type="number"
                min="1"
                max="500"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            {/* Status Selection */}
            <div data-node-id="88:2772">
              <label
                htmlFor="status-select"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Slot Status *
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as AvailabilitySlotStatus)}
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                {APPROVED_SLOT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Operational Notes
              </label>
              <input
                id="notes-input"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Crew duty ceiling or visual flight corridor restriction"
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>
          </div>
        </div>

        {/* Buttons (Figma Node 88:2778 & 88:2780) */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[48px] px-8 bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
            data-node-id="88:2778"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Save Slot Changes" : "Save Slot"}
          </button>

          <Link
            href="/availability/slots"
            className="h-[48px] px-6 bg-white border border-[#DDD8CF] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] inline-flex items-center justify-center transition-colors"
            data-node-id="88:2780"
          >
            Cancel
          </Link>
        </div>

        {/* Footnote (Figma Node 88:2782) */}
        <p className="text-[12px] text-[#5B616B] mt-4" data-node-id="88:2782">
          No direct active-allocation edit surface exists here.
        </p>
      </form>
    </div>
  );
}
