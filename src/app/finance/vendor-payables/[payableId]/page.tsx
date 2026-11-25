"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth/session";
import {
  StalePayableVersionConflictError,
  VendorPayableValidationError,
  vendorPayableRepository,
} from "@/lib/mock/vendor-payables";
import type { PayableStatus, VendorPayable } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function VendorPayableDetailPage() {
  const params = useParams();
  const payableId = params.payableId as string;
  const { user } = useSession();

  const [payable, setPayable] = useState<VendorPayable | null | undefined>(undefined);
  const [accessDenied, setAccessDenied] = useState(false);

  // Form states
  const [status, setStatus] = useState<PayableStatus>("PENDING");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [payoutReference, setPayoutReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !payableId) return;

    try {
      const record = vendorPayableRepository.getPayableById(user, payableId);
      if (record) {
        setPayable(record);
        setStatus(record.status);
        setAmountPaid(String(record.amountPaid));
        setPayoutReference(record.payoutReference || "");
        setNotes(record.notes || "");
        setAccessDenied(false);
      } else {
        setPayable(null);
      }
    } catch {
      setAccessDenied(true);
      setPayable(null);
    }
  }, [user, payableId]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payable || !user) return;

    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const parsedAmount = amountPaid.trim() === "" ? payable.amountPaid : Number(amountPaid);
      const updated = vendorPayableRepository.updateVendorPayable(user, {
        payableId: payable.id,
        amountPaid: parsedAmount,
        status,
        payoutReference,
        notes,
        expectedVersion: payable.version,
      });

      setPayable(updated);
      setSuccessMessage(
        `Payable ${updated.id} successfully updated (version ${updated.version}). Disbursement tracking recorded.`,
      );
    } catch (err: unknown) {
      if (err instanceof StalePayableVersionConflictError) {
        setFormError(
          "Stale version conflict (409): The payable was updated in another session. Please refresh and review.",
        );
      } else if (err instanceof VendorPayableValidationError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred while updating the payable.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (st: PayableStatus) => {
    switch (st) {
      case "PAID":
        return "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]";
      case "PROCESSING":
        return "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]";
      case "PENDING":
        return "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]";
      case "ON_HOLD":
        return "bg-[#F9F5FF] text-[#6941C6] border-[#E9D7FE]";
      case "FAILED":
        return "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]";
      default:
        return "bg-[#F2F4F7] text-[#344054] border-[#D0D5DD]";
    }
  };

  const isVendor = user?.role === "VENDOR";

  if (accessDenied) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-6 text-center">
            <h2 className="text-lg font-bold text-[#B42318]">Access Restricted</h2>
            <p className="text-sm text-[#5B616B] mt-2">
              You do not have permission to view this payable record. Vendor partners may only
              access payables assigned to their authorized organization.
            </p>
            <div className="mt-4">
              <Link href="/finance/vendor-payables">
                <Button className="bg-[#0B0C0E] text-white text-xs px-4 py-2 rounded-lg">
                  ← Return to Payables Directory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  if (payable === null) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Payable Not Found</h2>
            <p className="text-sm text-[#5B616B] mt-2">
              No vendor payable record was found matching ID &ldquo;{payableId}&rdquo;.
            </p>
            <div className="mt-6">
              <Link href="/finance/vendor-payables">
                <Button className="bg-[#0B0C0E] text-white text-xs px-4 py-2 rounded-lg">
                  ← Return to Payables Directory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  if (!payable) {
    return (
      <CommandCenterShell>
        <div className="p-8 text-center text-sm text-[#5B616B]">Loading payable record...</div>
      </CommandCenterShell>
    );
  }

  const remainingBalance = Math.max(0, payable.amountDue - payable.amountPaid);

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="90:3511"
        data-name="CC-FIN-02__VendorPayableDetail__Ready"
      >
        {/* Breadcrumb & Navigation */}
        <div className="mb-4">
          <Link
            href="/finance/vendor-payables"
            className="text-xs font-semibold text-[#164D53] hover:text-[#0B0C0E] transition-colors"
          >
            ← Back to Vendor Payables
          </Link>
        </div>

        {/* UI-API-02 Architectural Reconciliation Notice */}
        <div className="mb-6 p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#166534] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>
              <strong>UI-API-02 Reconciled:</strong> Payable context anchored to booking ledger.
              Banking disbursement execution is manual; tracking reflects off-platform corporate
              settlement.
            </span>
          </div>
          <span className="font-mono text-[11px] bg-white/80 px-2 py-0.5 rounded border border-[#BBF7D0]">
            Version {payable.version}
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#DDD8CF]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] font-bold text-[#0B0C0E] tracking-tight">
                Payable {payable.id}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(payable.status)}`}
              >
                {payable.status}
              </span>
            </div>
            <p className="text-sm text-[#5B616B] mt-1">
              Disbursement obligation for booking{" "}
              <strong className="text-[#0B0C0E]">{payable.bookingReference}</strong> ·{" "}
              {payable.serviceName}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase font-semibold text-[#5B616B] block">
              Agreed Vendor Obligation
            </span>
            <span className="text-2xl font-bold text-[#0B0C0E]">
              {payable.currency} {payable.amountDue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Context & Financial Audit */}
          <div className="lg:col-span-7 space-y-6">
            {/* Booking & Service Context */}
            <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0B0C0E] mb-4">Booking Ledger Context</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#5B616B] block">Booking Reference</span>
                  <span className="font-semibold text-[#0B0C0E] text-sm mt-0.5 block">
                    {payable.bookingReference}
                  </span>
                </div>
                <div>
                  <span className="text-[#5B616B] block">Service Category</span>
                  <span className="font-semibold text-[#0B0C0E] uppercase tracking-wider text-xs mt-0.5 block">
                    {payable.serviceCategory}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#5B616B] block">Service Offering</span>
                  <span className="font-medium text-[#0B0C0E] mt-0.5 block">
                    {payable.serviceName}
                  </span>
                </div>
              </div>
            </div>

            {/* Vendor Partner Information */}
            <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0B0C0E] mb-4">Vendor Organization</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#5B616B] block">Partner Name</span>
                  <span className="font-semibold text-[#0B0C0E] mt-0.5 block">
                    {payable.vendorName}
                  </span>
                </div>
                <div>
                  <span className="text-[#5B616B] block">Vendor ID</span>
                  <span className="font-mono text-[#5B616B] mt-0.5 block">{payable.vendorId}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#5B616B] block">Settlement Method</span>
                  <span className="font-medium text-[#0B0C0E] mt-0.5 block">
                    {payable.payoutMethod || "Corporate Bank Wire / SWIFT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Snapshot */}
            <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0B0C0E] mb-4">
                Financial Breakdown &amp; Balance
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-[#FAF8F4]">
                  <span className="text-[#5B616B]">Agreed Obligation Due</span>
                  <span className="font-semibold text-[#0B0C0E]">
                    {payable.currency} {payable.amountDue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#FAF8F4]">
                  <span className="text-[#5B616B]">Disbursed to Date</span>
                  <span className="font-semibold text-[#027A48]">
                    {payable.currency} {payable.amountPaid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-[#DDD8CF] text-base">
                  <span className="font-bold text-[#0B0C0E]">Outstanding Balance</span>
                  <span
                    className={`font-bold ${remainingBalance > 0 ? "text-[#B54708]" : "text-[#027A48]"}`}
                  >
                    {payable.currency} {remainingBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Footprint */}
            <div className="text-xs text-[#8C8F97] space-y-1">
              <div>Created: {new Date(payable.createdAt).toUTCString()}</div>
              <div>Authoritative Last Updated: {new Date(payable.updatedAt).toUTCString()}</div>
              <div>Optimistic Concurrency Lock: Version {payable.version}</div>
            </div>
          </div>

          {/* Right Column: Update Action Form or Read-Only Card */}
          <div className="lg:col-span-5">
            {isVendor ? (
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#0B0C0E]">Disbursement Status</h2>
                <div className="p-3 bg-[#FAF8F4] rounded-lg text-xs space-y-2">
                  <div>
                    <span className="text-[#5B616B] block">Current Status</span>
                    <span className="font-semibold text-[#0B0C0E]">{payable.status}</span>
                  </div>
                  <div>
                    <span className="text-[#5B616B] block">Wire / Payout Reference</span>
                    <span className="font-mono text-[#0B0C0E]">
                      {payable.payoutReference || "Pending issuance"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5B616B] block">Settlement Notes</span>
                    <span className="text-[#0B0C0E]">{payable.notes || "No notes recorded"}</span>
                  </div>
                </div>
                <p className="text-xs text-[#8C8F97]">
                  Vendor partner access is read-only. For inquiries regarding remittance details,
                  contact XTREME Concierge Operations.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-[#0B0C0E] mb-2">Update Payout Tracking</h2>
                <p className="text-xs text-[#5B616B] mb-5">
                  Record verified bank transfer execution and update settlement lifecycle.
                </p>

                {formError && (
                  <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs font-semibold text-[#B42318]">
                    {formError}
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-[#ECFDF3] border border-[#A6F4C5] rounded-lg text-xs font-semibold text-[#027A48]">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label
                      htmlFor="status-select"
                      className="block text-xs font-bold text-[#0B0C0E] uppercase tracking-wider mb-1"
                    >
                      Disbursement Status
                    </label>
                    <select
                      id="status-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PayableStatus)}
                      className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="PAID">PAID</option>
                      <option value="ON_HOLD">ON_HOLD</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="amount-paid-input"
                      className="block text-xs font-bold text-[#0B0C0E] uppercase tracking-wider mb-1"
                    >
                      Total Amount Paid ({payable.currency})
                    </label>
                    <input
                      id="amount-paid-input"
                      type="number"
                      step="any"
                      min="0"
                      max={payable.amountDue}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder={`Max ${payable.amountDue}`}
                      className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    />
                    <span className="text-[11px] text-[#8C8F97] mt-0.5 block">
                      Agreed due: {payable.amountDue} {payable.currency}
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="payout-ref-input"
                      className="block text-xs font-bold text-[#0B0C0E] uppercase tracking-wider mb-1"
                    >
                      Payout Reference / Wire ID
                    </label>
                    <input
                      id="payout-ref-input"
                      type="text"
                      value={payoutReference}
                      onChange={(e) => setPayoutReference(e.target.value)}
                      placeholder="e.g. WIRE-20261125-001 or SEPA ref"
                      className="w-full h-[40px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] font-mono focus:outline-none focus:border-[#0B0C0E]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="notes-textarea"
                      className="block text-xs font-bold text-[#0B0C0E] uppercase tracking-wider mb-1"
                    >
                      Internal Audit Notes
                    </label>
                    <textarea
                      id="notes-textarea"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Operational notes, remittance bank info, invoice verification details..."
                      className="w-full p-3 bg-white border border-[#DDD8CF] rounded-lg text-xs text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-[44px] bg-[#0B0C0E] hover:bg-[#17191D] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : "Save Payout Tracking Update"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </CommandCenterShell>
  );
}
