"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSession } from "@/lib/auth/session";
import { assetRepository } from "@/lib/mock/assets";
import { vendorRateRepository } from "@/lib/mock/vendor-rates";
import { vendorRepository } from "@/lib/mock/vendors";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

export function SubmitVendorRateForm() {
  const router = useRouter();
  const { user } = useSession();

  const isVendor = user?.role === "VENDOR";
  const vendorId = isVendor ? user.vendorId : "vnd_aerojet_99";

  let vendorOrg = undefined;
  let vendorAssets: ReturnType<typeof assetRepository.listAssets> = [];
  if (user) {
    try {
      vendorOrg = vendorRepository.getVendorById(user, vendorId || "vnd_aerojet_99");
    } catch {
      vendorOrg = undefined;
    }
    try {
      vendorAssets = assetRepository.listAssets(user, {
        vendorId: vendorId || undefined,
      });
    } catch {
      vendorAssets = [];
    }
  }

  const [vendorServiceId, setVendorServiceId] = useState("vs_aerojet_charter");
  const [vendorServiceName, setVendorServiceName] = useState("Charter Flight Operations");
  const [assetId, setAssetId] = useState("");
  const [amount, setAmount] = useState("4800");
  const [currency, setCurrency] = useState("USD");
  const [validFrom, setValidFrom] = useState("2026-07-01T00:00:00Z");
  const [validTo, setValidTo] = useState("2026-12-31T23:59:59Z");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number.parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid rate amount greater than zero.");
      return;
    }

    if (currency === "XOF" && !Number.isInteger(numAmount)) {
      setError("XOF is a zero-decimal integer currency. Fractional minor units are not permitted.");
      return;
    }

    const fromMs = Date.parse(validFrom);
    const toMs = Date.parse(validTo);
    if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
      setError("Please enter valid ISO date strings for validity period.");
      return;
    }
    if (fromMs >= toMs) {
      setError("validFrom date must strictly precede validTo date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAsset = vendorAssets.find((a) => a.id === assetId);

      vendorRateRepository.submitVendorRate(user, {
        vendorId: vendorId || "vnd_aerojet_99",
        vendorName: vendorOrg?.displayName || "Vendor Organization",
        vendorServiceId,
        vendorServiceName,
        assetId: assetId || undefined,
        assetName: selectedAsset?.name || undefined,
        amount: numAmount,
        currency,
        validFrom,
        validTo,
      });

      router.push("/pricing/vendor-rates");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit vendor rate.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Vendor Service */}
        <div>
          <label
            htmlFor="service-name-input"
            className="block text-sm font-medium text-[#0B0C0E] mb-2"
          >
            Vendor service
          </label>
          <Input
            id="service-name-input"
            value={vendorServiceName}
            onChange={(e) => {
              setVendorServiceName(e.target.value);
              setVendorServiceId(e.target.value.toLowerCase().replace(/\s+/g, "_"));
            }}
            placeholder="e.g. Charter Flight Operations"
            required
          />
          <p className="text-xs text-[#5B616B] mt-1">Identifier: {vendorServiceId}</p>
        </div>

        {/* Right Column: Asset (optional) */}
        <div>
          <label htmlFor="asset-select" className="block text-sm font-medium text-[#0B0C0E] mb-2">
            Asset (optional)
          </label>
          <select
            id="asset-select"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-[#DDD8CF] bg-white px-3 py-1.5 text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
          >
            <option value="">None (Service-wide standard rate)</option>
            {vendorAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.code})
              </option>
            ))}
          </select>
          <p className="text-xs text-[#5B616B] mt-1">
            Optional asset binding for fleet-specific unit rates.
          </p>
        </div>

        {/* Left Column: Amount */}
        <div>
          <label htmlFor="amount-input" className="block text-sm font-medium text-[#0B0C0E] mb-2">
            Amount
          </label>
          <Input
            id="amount-input"
            type="number"
            step={currency === "XOF" ? "1" : "0.01"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 4800"
            required
          />
          <p className="text-xs text-[#5B616B] mt-1">
            {currency === "XOF"
              ? "Integer amount without decimals."
              : "Numerical minor unit representation up to 2 decimal places."}
          </p>
        </div>

        {/* Right Column: Currency */}
        <div>
          <label
            htmlFor="currency-select"
            className="block text-sm font-medium text-[#0B0C0E] mb-2"
          >
            Currency
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="flex h-9 w-full rounded-md border border-[#DDD8CF] bg-white px-3 py-1.5 text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="XOF">XOF (CFA Franc)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Left Column: Validity Start */}
        <div>
          <label
            htmlFor="valid-from-input"
            className="block text-sm font-medium text-[#0B0C0E] mb-2"
          >
            Valid from
          </label>
          <Input
            id="valid-from-input"
            type="text"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            placeholder="YYYY-MM-DDTHH:mm:ssZ"
            required
          />
        </div>

        {/* Right Column: Validity End */}
        <div>
          <label htmlFor="valid-to-input" className="block text-sm font-medium text-[#0B0C0E] mb-2">
            Valid to
          </label>
          <Input
            id="valid-to-input"
            type="text"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            placeholder="YYYY-MM-DDTHH:mm:ssZ"
            required
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center space-x-4 pt-4 border-t border-[#EAE7DF]">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Rate Schedule"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/pricing/vendor-rates")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
