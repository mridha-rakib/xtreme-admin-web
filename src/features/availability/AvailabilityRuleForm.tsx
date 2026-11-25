"use client";

import { useSession } from "@/lib/auth/session";
import { assetRepository } from "@/lib/mock/assets";
import { availabilityRepository } from "@/lib/mock/availability";
import {
  APPROVED_TIMEZONES,
  APPROVED_WEEKDAYS,
  type ApprovedTimezone,
  type AvailabilityRule,
  type AvailabilityTargetType,
} from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

interface AvailabilityRuleFormProps {
  initialRule?: AvailabilityRule;
  isEdit?: boolean;
}

export function AvailabilityRuleForm({ initialRule, isEdit = false }: AvailabilityRuleFormProps) {
  const router = useRouter();
  const { user } = useSession();

  const [target, setTarget] = useState(initialRule?.target || "");
  const [targetType, setTargetType] = useState<AvailabilityTargetType>(
    initialRule?.targetType || "ASSET",
  );
  const [targetId, setTargetId] = useState(initialRule?.targetId || "");
  const [weekday, setWeekday] = useState(initialRule?.weekday || "Mon - Fri");
  const [startTime, setStartTime] = useState(initialRule?.startTime || "08:00");
  const [endTime, setEndTime] = useState(initialRule?.endTime || "20:00");
  const [timezone, setTimezone] = useState<ApprovedTimezone>(
    initialRule?.timezone || "Europe/Paris",
  );
  const [capacity, setCapacity] = useState<number | string>(initialRule?.capacity ?? 8);
  const [active, setActive] = useState<boolean>(initialRule?.active ?? true);
  const [notes, setNotes] = useState(initialRule?.notes || "");

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

    const capNum = typeof capacity === "number" ? capacity : Number.parseInt(String(capacity), 10);
    if (Number.isNaN(capNum) || capNum <= 0) {
      setError("Capacity must be a positive integer greater than zero.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Start time and end time are required.");
      return;
    }
    if (startTime >= endTime) {
      setError(`Start time (${startTime}) must precede end time (${endTime}).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && initialRule) {
        availabilityRepository.updateRule(user, initialRule.id, {
          target: cleanTarget,
          targetType,
          targetId: targetId || undefined,
          weekday,
          startTime,
          endTime,
          timezone,
          capacity: capNum,
          active,
          notes,
        });
      } else {
        availabilityRepository.createRule(user, {
          target: cleanTarget,
          targetType,
          targetId: targetId || undefined,
          weekday,
          startTime,
          endTime,
          timezone,
          capacity: capNum,
          active,
          notes,
        });
      }

      router.push("/availability");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save availability rule.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="p-[32px] max-w-[1280px] w-full"
      data-node-id="88:2336"
      data-name="CC-AVL-02__Admin__Ready"
    >
      {/* Title */}
      <div className="mb-[24px]">
        <h1
          className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
          data-node-id="88:2375"
        >
          {isEdit ? "Edit Availability Rule" : "Create / Edit Availability Rule"}
        </h1>
        <p className="text-[14px] text-[#5B616B] mt-[4px]">
          Define recurring operational scheduling boundaries and certified capacity windows.
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
            <div data-node-id="88:2376">
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

            {/* Weekday Input */}
            <div data-node-id="88:2381">
              <label
                htmlFor="weekday-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Weekday Schedule *
              </label>
              <select
                id="weekday-input"
                value={weekday}
                onChange={(e) => setWeekday(e.target.value)}
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                {APPROVED_WEEKDAYS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Type */}
            <div data-node-id="88:2386">
              <label
                htmlFor="target-type-select"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Target Type *
              </label>
              <select
                id="target-type-select"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as AvailabilityTargetType)}
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ASSET">Physical Asset (Specific Hull / Tail / Chassis)</option>
                <option value="CATEGORY">Service Fleet Category (General Capacity)</option>
              </select>
            </div>

            {/* Start Time */}
            <div data-node-id="88:2392">
              <label
                htmlFor="start-time-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Start Time (HH:mm) *
              </label>
              <input
                id="start-time-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            {/* End Time */}
            <div data-node-id="88:2397">
              <label
                htmlFor="end-time-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                End Time (HH:mm) *
              </label>
              <input
                id="end-time-input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            {/* Capacity */}
            <div data-node-id="88:2402">
              <label
                htmlFor="capacity-input"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Certified Passenger Capacity *
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

            {/* Timezone */}
            <div data-node-id="88:2407">
              <label
                htmlFor="timezone-select"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Canonical Timezone *
              </label>
              <select
                id="timezone-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value as ApprovedTimezone)}
                className="w-full h-[44px] px-3.5 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                {APPROVED_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Toggle */}
            <div data-node-id="88:2413">
              <label
                htmlFor="active-toggle"
                className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
              >
                Rule Active Status
              </label>
              <div className="flex items-center gap-4 h-[44px]">
                <label className="inline-flex items-center gap-2 cursor-pointer text-[14px]">
                  <input
                    type="radio"
                    name="activeStatus"
                    checked={active === true}
                    onChange={() => setActive(true)}
                    className="accent-[#0B0C0E]"
                  />
                  <span className="font-medium text-[#03543F]">Active</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-[14px]">
                  <input
                    type="radio"
                    name="activeStatus"
                    checked={active === false}
                    onChange={() => setActive(false)}
                    className="accent-[#0B0C0E]"
                  />
                  <span className="font-medium text-[#5B616B]">Inactive</span>
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes-textarea"
              className="block text-[13px] font-semibold text-[#0B0C0E] mb-1.5"
            >
              Operational Notes &amp; Scope Details
            </label>
            <textarea
              id="notes-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Weekday chartered flight schedule covering Côte d'Azur regional corridors."
              className="w-full p-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
        </div>

        {/* Buttons (Figma Node 88:2419 & 88:2421) */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[48px] px-8 bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
            data-node-id="88:2419"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Save Rule Changes" : "Save Rule"}
          </button>

          <Link
            href="/availability"
            className="h-[48px] px-6 bg-white border border-[#DDD8CF] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] inline-flex items-center justify-center transition-colors"
            data-node-id="88:2421"
          >
            Cancel
          </Link>
        </div>

        {/* Footnote (Figma Node 88:2423) */}
        <p className="text-[12px] text-[#5B616B] mt-4" data-node-id="88:2423">
          Target/ownership validation is authoritative; configuration cannot bypass existing
          reservations.
        </p>
      </form>
    </div>
  );
}
