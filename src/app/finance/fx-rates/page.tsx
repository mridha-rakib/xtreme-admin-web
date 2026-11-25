"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { FinanceNavigationTabs } from "@/features/finance/FinanceNavigationTabs";
import { useSession } from "@/lib/auth/session";
import {
  FxRateValidationError,
  UnauthorizedFxAccessError,
  fxRateRepository,
} from "@/lib/mock/fx-rates";
import type { FxPair, FxRateAuditEntry, FxRateRecord } from "@/types";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";

export default function FxRatesManagementPage() {
  const { user } = useSession();
  const [rates, setRates] = useState<FxRateRecord[]>([]);
  const [auditLog, setAuditLog] = useState<FxRateAuditEntry[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);

  // Override Modal / Form State
  const [overrideModalPair, setOverrideModalPair] = useState<FxPair | null>(null);
  const [overrideRateInput, setOverrideRateInput] = useState<string>("");
  const [overrideReasonInput, setOverrideReasonInput] = useState<string>("");
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadRates = () => {
      try {
        const r = fxRateRepository.listRates(user);
        const a = fxRateRepository.getAuditLog(user);
        setRates(r);
        setAuditLog(a);
        setAccessDenied(false);
      } catch {
        setAccessDenied(true);
        setRates([]);
      }
    };

    loadRates();
    const unsubscribe = fxRateRepository.subscribe(loadRates);
    return () => unsubscribe();
  }, [user]);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const handleOpenOverride = (pair: FxPair) => {
    const current = rates.find((r) => r.pair === pair);
    setOverrideModalPair(pair);
    setOverrideRateInput(current ? String(current.rate) : "");
    setOverrideReasonInput("");
    setOverrideError(null);
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !overrideModalPair) return;

    setOverrideError(null);
    setActionSuccess(null);

    const parsedRate = Number(overrideRateInput);
    if (Number.isNaN(parsedRate) || parsedRate <= 0) {
      setOverrideError("Override rate must be a valid positive number.");
      return;
    }
    if (!overrideReasonInput.trim()) {
      setOverrideError("Operational justification reason is required for manual FX override.");
      return;
    }

    try {
      fxRateRepository.setManualOverride(user, {
        pair: overrideModalPair,
        rate: parsedRate,
        reason: overrideReasonInput.trim(),
      });
      setActionSuccess(`Manual override saved for ${overrideModalPair} at ${parsedRate} XOF.`);
      setOverrideModalPair(null);
    } catch (err: unknown) {
      if (err instanceof FxRateValidationError || err instanceof UnauthorizedFxAccessError) {
        setOverrideError(err.message);
      } else {
        setOverrideError("Failed to apply FX rate override.");
      }
    }
  };

  const handleClearOverride = (pair: FxPair) => {
    if (!user) return;
    setActionSuccess(null);
    setOverrideError(null);

    try {
      const restored = fxRateRepository.clearManualOverride(user, pair);
      setActionSuccess(
        `Cleared manual override for ${pair}. Restored to automated rate ${restored.rate} XOF.`,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setOverrideError(err.message);
      } else {
        setOverrideError("Failed to clear FX rate override.");
      }
    }
  };

  if (accessDenied || user?.role === "VENDOR") {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-[#B42318]">Access Restricted (403)</h2>
            <p className="text-sm text-[#5B616B] mt-2 max-w-lg mx-auto">
              FX rates and treasury conversions are confidential to Command Center administrators.
              Vendor partners cannot view or modify FX rate schedules.
            </p>
            <div className="mt-6">
              <Link href="/finance/vendor-payables">
                <Button className="bg-[#0B0C0E] text-white text-xs px-5 py-2.5 rounded-lg">
                  ← Go to My Vendor Payables
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="90:3661"
        data-name="CC-FX-01__FxRatesOverride__Ready"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-tight leading-[36px]"
              data-node-id="90:3665"
            >
              FX Rates &amp; Manual Override
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Authoritative currency exchange rates for multi-currency conversion to canonical XOF
            </p>
          </div>

          {!isSuperAdmin && (
            <div className="px-3.5 py-1.5 rounded-lg bg-[#FFFAEB] border border-[#FEDF89] text-xs font-medium text-[#B54708]">
              Read-only view · Manual overrides require Super Admin authority
            </div>
          )}
        </div>

        {/* Finance Sub-navigation Tabs */}
        <FinanceNavigationTabs />

        {/* Immutability & Safety Banner */}
        <div className="mb-6 p-4 rounded-xl bg-[#FAF8F4] border border-[#DDD8CF] text-xs text-[#5B616B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#164D53]" />
            <span>
              <strong>Immutable Historical Snapshots:</strong> Historical transaction and booking
              snapshots remain strictly immutable and are not retroactively modified by FX
              adjustments.
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#8C8F97]">
            Base Currency: XOF (CFA Franc BCEAO)
          </span>
        </div>

        {actionSuccess && (
          <div className="mb-6 p-3.5 bg-[#ECFDF3] border border-[#A6F4C5] rounded-xl text-xs font-semibold text-[#027A48]">
            {actionSuccess}
          </div>
        )}

        {overrideError && (
          <div className="mb-6 p-3.5 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl text-xs font-semibold text-[#B42318]">
            {overrideError}
          </div>
        )}

        {/* Two Primary Rate Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {rates.map((record) => {
            const isManual = record.source === "MANUAL";
            return (
              <div
                key={record.id}
                className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#0B0C0E]">{record.pair}</span>
                      <span className="text-xs text-[#5B616B]">
                        ({record.baseCurrency} to {record.quoteCurrency})
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isManual
                          ? "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]"
                          : "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]"
                      }`}
                    >
                      {record.source}
                    </span>
                  </div>

                  <div className="text-3xl font-bold text-[#0B0C0E] tracking-tight mb-2">
                    1 {record.baseCurrency} = {record.rate.toLocaleString()} XOF
                  </div>

                  <div className="text-xs text-[#5B616B] space-y-1 mb-6">
                    <div>
                      Effective:{" "}
                      {new Date(record.effectiveTimestamp).toLocaleString("en-US", {
                        timeZone: "UTC",
                      })}{" "}
                      UTC
                    </div>
                    <div>Automated Market Ingestion: {record.lastAutoRate} XOF</div>
                    {isManual && record.overrideReason && (
                      <div className="mt-2 p-2.5 bg-[#FAF8F4] rounded-lg border border-[#DDD8CF] text-[11px] text-[#0B0C0E]">
                        <strong>Override Justification:</strong> {record.overrideReason}
                        <div className="text-[#8C8F97] mt-0.5">
                          By {record.overriddenBy} at{" "}
                          {new Date(record.overrideTimestamp || "").toUTCString()}
                        </div>
                      </div>
                    )}
                    {record.pair === "EUR/XOF" && !isManual && (
                      <div className="text-[11px] text-[#164D53] mt-1">
                        ★ Canonical fixed parity peg (BCEAO statutory rate: 655.957)
                      </div>
                    )}
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="pt-4 border-t border-[#DDD8CF] flex items-center gap-3">
                    <Button
                      onClick={() => handleOpenOverride(record.pair)}
                      className="h-[36px] px-4 bg-[#0B0C0E] hover:bg-[#17191D] text-white text-xs font-semibold rounded-lg"
                    >
                      {isManual ? "Edit Override" : "Manual Override"}
                    </Button>
                    {isManual && (
                      <Button
                        variant="secondary"
                        onClick={() => handleClearOverride(record.pair)}
                        className="h-[36px] px-4 text-xs font-semibold border border-[#DDD8CF] text-[#B42318] hover:bg-[#FEF3F2] rounded-lg"
                      >
                        Clear Override (Reset to Auto)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#DDD8CF] bg-[#FAF8F4] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B0C0E]">
              FX Rate Modification &amp; Ingestion Audit Trail
            </h2>
            <span className="text-xs text-[#5B616B]">Immutable administrative ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#DDD8CF] text-xs font-semibold text-[#5B616B] uppercase tracking-wider bg-white">
                  <th className="py-3 px-4">Currency Pair</th>
                  <th className="py-3 px-4">Rate (XOF)</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Operator / Ingestion</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4 text-right">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF] text-[#0B0C0E]">
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#FAF8F4] transition-colors">
                    <td className="py-3 px-4 font-bold text-xs">{entry.pair}</td>
                    <td className="py-3 px-4 font-mono text-sm">{entry.rate}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          entry.source === "MANUAL"
                            ? "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]"
                            : "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]"
                        }`}
                      >
                        {entry.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">{entry.changedBy}</td>
                    <td className="py-3 px-4 text-xs text-[#5B616B] max-w-xs truncate">
                      {entry.reason || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#5B616B] text-right font-mono">
                      {new Date(entry.timestamp).toISOString().replace("T", " ").substring(0, 19)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Manual Override Dialog */}
        {overrideModalPair && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DDD8CF]">
              <div className="flex items-center justify-between pb-4 border-b border-[#DDD8CF] mb-4">
                <h3 className="text-base font-bold text-[#0B0C0E]">
                  Manual FX Override: {overrideModalPair}
                </h3>
                <button
                  type="button"
                  onClick={() => setOverrideModalPair(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {overrideError && (
                <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs font-semibold text-[#B42318]">
                  {overrideError}
                </div>
              )}

              <form onSubmit={handleSaveOverride} className="space-y-4">
                <div>
                  <label
                    htmlFor="override-rate-field"
                    className="block text-xs font-bold text-[#0B0C0E] uppercase tracking-wider mb-1"
                  >
                    Override Exchange Rate (1 {overrideModalPair.split("/")[0]} = ? XOF)
                  </label>
                  <input
                    id="override-rate-field"
                    type="number"
                    step="any"
                    value={overrideRateInput}
                    onChange={(e) => setOverrideRateInput(e.target.value)}
                    placeholder="e.g. 615.00"
                    className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-sm font-mono text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="override-reason-field"
                    className="block text-xs font-bold text-[#0B0C0E] uppercase tracking-wider mb-1"
                  >
                    Operational Justification (Required)
                  </label>
                  <textarea
                    id="override-reason-field"
                    rows={3}
                    value={overrideReasonInput}
                    onChange={(e) => setOverrideReasonInput(e.target.value)}
                    placeholder="Document treasury reason, liquidity buffer adjustment, or central bank bulletin reference..."
                    className="w-full p-3 bg-white border border-[#DDD8CF] rounded-lg text-xs text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOverrideModalPair(null)}
                    className="h-[38px] px-4 text-xs font-semibold border border-[#DDD8CF]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-[38px] px-5 bg-[#0B0C0E] hover:bg-[#17191D] text-white text-xs font-semibold rounded-lg"
                  >
                    Save Override
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CommandCenterShell>
  );
}
