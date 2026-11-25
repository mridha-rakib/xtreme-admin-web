"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { AvailabilityValidationError, availabilityRepository } from "@/lib/mock/availability";
import type { AvailabilityRule } from "@/types/availability";
import type React from "react";
import { useEffect, useState } from "react";

export default function AvailabilityRulesPage() {
  const { user } = useSession();

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | "ALL">("ALL");

  // Modal / Drawer state for Create / Edit rule
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AvailabilityRule | null>(null);
  const [target, setTarget] = useState("");
  const [weekday, setWeekday] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [timezone, setTimezone] = useState("");
  const [capacity, setCapacity] = useState("6");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadRules = () => {
      const vendorId = user?.role === "VENDOR" ? user.vendorId : undefined;
      const filtered = availabilityRepository.listRules({
        vendorId,
        active: activeFilter,
        search,
      });
      setRules(filtered);
    };

    loadRules();
    const unsubscribe = availabilityRepository.subscribe(loadRules);
    return () => unsubscribe();
  }, [user, search, activeFilter]);

  const handleOpenCreate = () => {
    setSelectedRule(null);
    setTarget("");
    setWeekday("Mon - Fri");
    setTimeWindow("08:00 - 20:00");
    setTimezone("Europe/Paris (UTC+1)");
    setCapacity("6");
    setActive(true);
    setNotes("");
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: AvailabilityRule) => {
    setSelectedRule(rule);
    setTarget(rule.target);
    setWeekday(rule.weekday);
    setTimeWindow(rule.timeWindow);
    setTimezone(rule.timezone);
    setCapacity(String(rule.capacity));
    setActive(rule.active);
    setNotes(rule.notes || "");
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const capNum = Number(capacity);
    if (!target.trim()) {
      setFormError("Target asset or category is required.");
      return;
    }
    if (Number.isNaN(capNum) || capNum <= 0) {
      setFormError("Capacity must be a positive number.");
      return;
    }

    try {
      if (selectedRule) {
        availabilityRepository.updateRule(selectedRule.id, {
          target: target.trim(),
          weekday: weekday.trim(),
          timeWindow: timeWindow.trim(),
          timezone: timezone.trim(),
          capacity: capNum,
          active,
          notes: notes.trim(),
        });
        setFormSuccess("Availability rule updated successfully.");
      } else {
        availabilityRepository.createRule({
          target: target.trim(),
          weekday: weekday.trim(),
          timeWindow: timeWindow.trim(),
          timezone: timezone.trim(),
          capacity: capNum,
          active,
          vendorId: user?.role === "VENDOR" ? user.vendorId : undefined,
          notes: notes.trim(),
        });
        setFormSuccess("Availability rule created successfully.");
      }

      setTimeout(() => {
        setIsModalOpen(false);
      }, 500);
    } catch (err) {
      if (err instanceof AvailabilityValidationError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save availability rule.");
      }
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="88:2228"
        data-name="CC-AVL-01__Admin__Ready"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="88:2267"
            >
              Availability Rules
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-AVL-01 (Node 88:2228) · Operational Time Slots &amp; Capacity Windows
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-[48px] min-w-[240px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors shadow-sm"
              data-node-id="88:2268"
            >
              Create rule
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-4 shadow-card mb-[20px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px] max-w-[480px] relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rules by target asset, weekday, or timezone..."
              className="w-full h-[40px] pl-3.5 pr-8 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-[#5B616B] hover:text-[#0B0C0E] text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#5B616B] font-medium">Active:</span>
            <div className="inline-flex rounded-[8px] border border-[#DDD8CF] p-0.5 bg-[#FAF8F4]">
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  activeFilter === "ALL"
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter(true)}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  activeFilter === true
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter(false)}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                  activeFilter === false
                    ? "bg-white text-[#0B0C0E] shadow-sm"
                    : "text-[#5B616B] hover:text-[#0B0C0E]"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* Rules Table (Figma Node 88:2270) */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card mb-[16px]"
          data-node-id="88:2270"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="bg-[#EEE9E0] border-b border-[#DDD8CF] text-[#5B616B] text-[13px] font-semibold"
                  data-node-id="88:2271"
                >
                  <th className="py-3.5 px-6" data-node-id="88:2272">
                    Target
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2273">
                    Weekday
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2274">
                    Time window
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2275">
                    Timezone
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2276">
                    Capacity
                  </th>
                  <th className="py-3.5 px-6" data-node-id="88:2277">
                    Active
                  </th>
                  <th className="py-3.5 px-6 text-right" data-node-id="88:2278">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF]">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5B616B] text-[14px]">
                      No availability rules configured.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#0B0C0E] text-[14px]">
                        {rule.target}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#0B0C0E]">{rule.weekday}</td>
                      <td className="py-4 px-6 text-[14px] font-mono text-[#0B0C0E]">
                        {rule.timeWindow}
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#5B616B]">{rule.timezone}</td>
                      <td className="py-4 px-6 text-[14px] font-medium text-[#0B0C0E]">
                        {rule.capacity} units
                      </td>
                      <td className="py-4 px-6 text-[14px]">
                        {rule.active ? (
                          <span className="inline-flex items-center gap-1.5 text-[#03543F] font-semibold">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[#5B616B]">
                            <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rule)}
                          className="text-[#164D53] hover:text-[#0B0C0E] font-semibold text-[14px] inline-flex items-center gap-1"
                          data-node-id="88:2286"
                        >
                          Open ›
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footnote (Figma Node 88:2335) */}
        <p className="text-[12px] text-[#5B616B]" data-node-id="88:2335">
          Configuration only. No direct active-allocation write controls are exposed.
        </p>

        {/* Modal / Configuration Drawer */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-[16px] border border-[#DDD8CF] shadow-xl w-full max-w-[600px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-[#FAF8F4] border-b border-[#DDD8CF] flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-bold text-[#0B0C0E]">
                    {selectedRule ? "Edit Availability Rule" : "Create Availability Rule"}
                  </h3>
                  <p className="text-[12px] text-[#5B616B]">
                    Figma CC-AVL-01 · Configuration Rule Editor
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#5B616B] hover:text-[#0B0C0E] font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[8px] text-[#9B1C1C] text-[13px] font-medium">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-[#DEF7EC] border border-[#84E1BC] rounded-[8px] text-[#03543F] text-[13px] font-medium">
                    {formSuccess}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="rule-target"
                    className="block text-[13px] font-semibold text-[#0B0C0E] mb-1"
                  >
                    Target Asset or Category <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="rule-target"
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="e.g. Cessna Citation Latitude (AST-AJ-01)"
                    className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="rule-weekday"
                      className="block text-[13px] font-semibold text-[#0B0C0E] mb-1"
                    >
                      Weekday
                    </label>
                    <input
                      id="rule-weekday"
                      type="text"
                      value={weekday}
                      onChange={(e) => setWeekday(e.target.value)}
                      placeholder="e.g. Mon - Fri, Daily"
                      className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="rule-window"
                      className="block text-[13px] font-semibold text-[#0B0C0E] mb-1"
                    >
                      Time Window
                    </label>
                    <input
                      id="rule-window"
                      type="text"
                      value={timeWindow}
                      onChange={(e) => setTimeWindow(e.target.value)}
                      placeholder="e.g. 06:00 - 22:00"
                      className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="rule-timezone"
                      className="block text-[13px] font-semibold text-[#0B0C0E] mb-1"
                    >
                      Timezone
                    </label>
                    <input
                      id="rule-timezone"
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="e.g. Europe/Paris (UTC+1)"
                      className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="rule-capacity"
                      className="block text-[13px] font-semibold text-[#0B0C0E] mb-1"
                    >
                      Capacity Window <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="rule-capacity"
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="rule-active"
                    className="block text-[13px] font-semibold text-[#0B0C0E] mb-1"
                  >
                    Active Rule Status
                  </label>
                  <select
                    id="rule-active"
                    value={active ? "yes" : "no"}
                    onChange={(e) => setActive(e.target.value === "yes")}
                    className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                  >
                    <option value="yes">Yes · Active and enforces allocation availability</option>
                    <option value="no">No · Inactive rule</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="rule-notes"
                    className="block text-[13px] font-semibold text-[#0B0C0E] mb-1"
                  >
                    Notes / Scope Rule
                  </label>
                  <input
                    id="rule-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Configuration only notes"
                    className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#DDD8CF]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-[40px] px-4 rounded-[8px] border border-[#DDD8CF] bg-white text-[13px] font-semibold text-[#0B0C0E] hover:bg-[#FAF8F4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-[40px] px-5 rounded-[8px] bg-[#0B0C0E] text-white text-[13px] font-semibold hover:bg-[#17191D]"
                  >
                    Save Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CommandCenterShell>
  );
}
