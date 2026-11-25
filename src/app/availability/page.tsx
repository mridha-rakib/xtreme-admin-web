"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { availabilityRepository } from "@/lib/mock/availability";
import type { AvailabilityRule } from "@/types/availability";
import React, { useEffect, useState } from "react";

export default function AvailabilityRulesPage() {
  const { user } = useSession();

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | "ALL">("ALL");
  const [scopeNotice, setScopeNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadRules = () => {
      try {
        const vendorId = user.role === "VENDOR" ? user.vendorId : undefined;
        const filtered = availabilityRepository.listRules(user, {
          vendorId,
          active: activeFilter,
          search,
        });
        setRules(filtered);
      } catch {
        setRules([]);
      }
    };

    loadRules();
    const unsubscribe = availabilityRepository.subscribe(loadRules);
    return () => unsubscribe();
  }, [user, search, activeFilter]);

  const handleScopeNotice = () => {
    setScopeNotice(
      "CC-AVL-02 Availability Rule Detail & Editor is scheduled for a future planned phase. Configuration overview only; active allocation write controls are not exposed.",
    );
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
              Operational Time Slots &amp; Capacity Windows
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleScopeNotice}
              className="h-[48px] min-w-[240px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors shadow-sm"
              data-node-id="88:2268"
            >
              Create rule
            </button>
          </div>
        </div>

        {/* Scope Guard Banner */}
        {scopeNotice && (
          <div className="mb-[24px] p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] text-[#1E40AF] text-[13px] flex items-center justify-between">
            <span>{scopeNotice}</span>
            <button
              type="button"
              onClick={() => setScopeNotice(null)}
              className="text-[#1E40AF] font-bold text-sm ml-4"
            >
              ✕
            </button>
          </div>
        )}

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
                      <td className="py-4 px-6 text-[13px] text-[#5B616B]">
                        {rule.timezoneDisplay || rule.timezone}
                      </td>
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
                          onClick={handleScopeNotice}
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
      </div>
    </CommandCenterShell>
  );
}
