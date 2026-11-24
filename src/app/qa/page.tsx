"use client";

import { MOCK_PERSONAS, useSession } from "@/lib/auth/session";
import { bookingRepository } from "@/lib/mock/bookings";
import { customerRepository } from "@/lib/mock/customers";
import type { CommandCenterRole } from "@/types";
import Link from "next/link";
import React, { useState } from "react";

export default function QAEnvironmentHub() {
  const { user, status, switchRole, signIn, signOut } = useSession();
  const [isSimulatedFailure, setIsSimulatedFailure] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRoleChange = (role: CommandCenterRole) => {
    switchRole(role);
    setStatusMessage(`Switched active persona to ${role}`);
  };

  const toggleFailure = () => {
    const nextState = !isSimulatedFailure;
    setIsSimulatedFailure(nextState);
    customerRepository.setSimulateFailure(nextState);
    setStatusMessage(
      nextState
        ? "Enabled simulated query failure in CustomerRepository"
        : "Disabled simulated failure; repository operational",
    );
  };

  const handleReset = () => {
    customerRepository.resetToDefaults();
    bookingRepository.resetDefaults();
    setIsSimulatedFailure(false);
    setStatusMessage("Customer and Booking repositories reset to initial deterministic state");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] p-8 text-[#0B0C0E]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-[#DDD8CF] pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Isolated QA Control Hub</h1>
            <p className="text-sm text-[#5B616B] mt-1">
              Development & testing environment for session states, personas, and fault injection.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
          >
            ← Back to Command Center
          </Link>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-md bg-[#E8F5E9] border border-[#A5D6A7] text-xs font-semibold text-[#0E7047]">
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Session & Persona Controls */}
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold">Session & Persona Governance</h2>
            <div className="text-xs space-y-1.5 p-3 bg-[#FAF8F4] rounded-lg border border-[#DDD8CF]">
              <p>
                <span className="text-[#5B616B]">Status:</span>{" "}
                <span className="font-semibold">{status}</span>
              </p>
              <p>
                <span className="text-[#5B616B]">Current User:</span>{" "}
                <span className="font-semibold">{user?.name || "None (Unauthenticated)"}</span>
              </p>
              <p>
                <span className="text-[#5B616B]">Active Role:</span>{" "}
                <span className="font-semibold">{user?.role || "GUEST"}</span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5B616B] block">
                Switch Operational Persona
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(MOCK_PERSONAS) as CommandCenterRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`px-3 py-2 text-xs font-semibold rounded-md border text-left transition-colors ${
                      user?.role === r
                        ? "bg-[#0B0C0E] text-white border-[#0B0C0E]"
                        : "bg-white text-[#0B0C0E] border-[#DDD8CF] hover:bg-[#FAF8F4]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setStatusMessage("Signed out. Session is now unauthenticated.");
                }}
                className="flex-1 py-2 bg-white border border-[#DDD8CF] text-xs font-semibold text-[#B42318] rounded-md hover:bg-[#FEF3F2]"
              >
                Sign Out
              </button>
              <button
                type="button"
                onClick={() => {
                  signIn("SUPER_ADMIN");
                  setStatusMessage("Signed in as default Super Admin");
                }}
                className="flex-1 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
              >
                Sign In (Super Admin)
              </button>
            </div>
          </div>

          {/* Repository & Fault Injection */}
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold">Repository State & Scenarios</h2>
            <p className="text-xs text-[#5B616B]">
              Inject deterministic errors or reset customer database to initial seed.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={toggleFailure}
                className={`w-full py-2.5 px-4 rounded-md text-xs font-semibold border flex items-center justify-between ${
                  isSimulatedFailure
                    ? "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]"
                    : "bg-white text-[#0B0C0E] border-[#DDD8CF] hover:bg-[#FAF8F4]"
                }`}
              >
                <span>Simulate Query Failure</span>
                <span className="font-bold">{isSimulatedFailure ? "ON (Failing)" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 px-4 bg-[#A88343] hover:bg-[#967439] text-white rounded-md text-xs font-semibold text-center transition-colors"
              >
                Reset Customers to Initial Defaults
              </button>
            </div>

            <div className="border-t border-[#DDD8CF] pt-4 mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B616B] mb-2">
                Batch 1 Verification Routes
              </h3>
              <ul className="text-xs space-y-1.5 text-[#164D53] font-medium">
                <li>
                  <Link href="/auth/sign-in" className="hover:underline">
                    → CC-AUTH-01: Sign In (/auth/sign-in)
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:underline">
                    → CC-HOME-01: Super Admin Dashboard (/)
                  </Link>
                </li>
                <li>
                  <Link href="/customers" className="hover:underline">
                    → CC-CUS-01: Customers Directory (/customers)
                  </Link>
                </li>
                <li>
                  <Link href="/customers/cus_001" className="hover:underline">
                    → CC-CUS-02: Customer Detail — Olivia Carter (/customers/cus_001)
                  </Link>
                </li>
                <li>
                  <Link href="/customers/cus_001/edit" className="hover:underline">
                    → CC-CUS-03: Edit Customer Profile (/customers/cus_001/edit)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customers/non-existent-id"
                    className="hover:underline text-[#B42318]"
                  >
                    → Not Found State (/customers/non-existent-id)
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
