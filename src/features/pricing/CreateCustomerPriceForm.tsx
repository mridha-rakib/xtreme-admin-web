"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSession } from "@/lib/auth/session";
import { customerPriceRepository } from "@/lib/mock/customer-prices";
import type { CustomerPriceMode, ServiceCategory } from "@/types";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

export function CreateCustomerPriceForm() {
  const router = useRouter();
  const { user } = useSession();

  const [serviceName, setServiceName] = useState("Private Jet Charter · Europe");
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("aviation");
  const [vendorServiceOrAsset, setVendorServiceOrAsset] = useState(
    "Cessna Citation Latitude (AST-AJ-01)",
  );
  const [priceMode, setPriceMode] = useState<CustomerPriceMode>("FIXED");
  const [xofAmount, setXofAmount] = useState("3500000");
  const [validFrom, setValidFrom] = useState("2026-07-01T00:00:00Z");
  const [validTo, setValidTo] = useState("2026-12-31T23:59:59Z");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = Number.parseInt(xofAmount, 10);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid positive integer XOF amount.");
      return;
    }

    const fromMs = Date.parse(validFrom);
    const toMs = Date.parse(validTo);
    if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
      setError("Please enter valid ISO date strings for validity interval.");
      return;
    }
    if (fromMs >= toMs) {
      setError("validFrom date must strictly precede validTo date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceId = `srv_${serviceCategory}_${Date.now().toString(36).substring(0, 4)}`;

      customerPriceRepository.createCustomerPrice(user, {
        serviceId,
        serviceName,
        serviceCategory,
        vendorServiceName: vendorServiceOrAsset || undefined,
        priceMode,
        xofAmount: amountNum,
        validFrom,
        validTo,
        active,
      });

      router.push("/pricing/customer-prices");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create customer price configuration.",
      );
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
        {/* Left Column: Service */}
        <div>
          <label htmlFor="service-name" className="block text-sm font-medium text-[#0B0C0E] mb-2">
            Service
          </label>
          <Input
            id="service-name"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g. Private Jet Charter · Europe"
            required
          />
          <div className="mt-2">
            <label
              htmlFor="category-select"
              className="block text-xs font-medium text-[#5B616B] mb-1"
            >
              Category
            </label>
            <select
              id="category-select"
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value as ServiceCategory)}
              className="flex h-9 w-full rounded-md border border-[#DDD8CF] bg-white px-3 py-1.5 text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="aviation">Aviation</option>
              <option value="yacht">Yacht</option>
              <option value="chauffeur">Chauffeur</option>
              <option value="dining">Dining</option>
              <option value="security">Security</option>
              <option value="experiences">Experiences / Expeditions</option>
            </select>
          </div>
        </div>

        {/* Right Column: Vendor Service / Asset (optional) */}
        <div>
          <label
            htmlFor="vendor-asset-input"
            className="block text-sm font-medium text-[#0B0C0E] mb-2"
          >
            Vendor service / Asset (optional)
          </label>
          <Input
            id="vendor-asset-input"
            value={vendorServiceOrAsset}
            onChange={(e) => setVendorServiceOrAsset(e.target.value)}
            placeholder="e.g. Cessna Citation Latitude (AST-AJ-01)"
          />
          <p className="text-xs text-[#5B616B] mt-1">
            Optional specific vendor service or asset binding.
          </p>
        </div>

        {/* Left Column: Price Mode */}
        <div>
          <label
            htmlFor="price-mode-select"
            className="block text-sm font-medium text-[#0B0C0E] mb-2"
          >
            Price mode
          </label>
          <select
            id="price-mode-select"
            value={priceMode}
            onChange={(e) => setPriceMode(e.target.value as CustomerPriceMode)}
            className="flex h-9 w-full rounded-md border border-[#DDD8CF] bg-white px-3 py-1.5 text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
          >
            <option value="FIXED">FIXED</option>
            <option value="TIERED">TIERED</option>
            <option value="DYNAMIC_BASE">DYNAMIC_BASE</option>
            <option value="ESTIMATED_QUOTE">ESTIMATED_QUOTE</option>
          </select>
          <p className="text-xs text-[#5B616B] mt-1">Authoritative pricing mode configuration.</p>
        </div>

        {/* Right Column: XOF Amount */}
        <div>
          <label
            htmlFor="xof-amount-input"
            className="block text-sm font-medium text-[#0B0C0E] mb-2"
          >
            XOF amount
          </label>
          <Input
            id="xof-amount-input"
            type="number"
            step="1"
            value={xofAmount}
            onChange={(e) => setXofAmount(e.target.value)}
            placeholder="e.g. 3500000"
            required
          />
          <p className="text-xs text-[#5B616B] mt-1">
            Authoritative Customer selling price in West African CFA Francs (zero-decimal integer).
          </p>
        </div>

        {/* Left Column: Validity Start */}
        <div>
          <label
            htmlFor="validity-from-input"
            className="block text-sm font-medium text-[#0B0C0E] mb-2"
          >
            Valid from
          </label>
          <Input
            id="validity-from-input"
            type="text"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            placeholder="YYYY-MM-DDTHH:mm:ssZ"
            required
          />
        </div>

        {/* Right Column: Validity End */}
        <div>
          <label
            htmlFor="validity-to-input"
            className="block text-sm font-medium text-[#0B0C0E] mb-2"
          >
            Valid to
          </label>
          <Input
            id="validity-to-input"
            type="text"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            placeholder="YYYY-MM-DDTHH:mm:ssZ"
            required
          />
        </div>

        {/* Active Status */}
        <div>
          <label
            htmlFor="active-status-select"
            className="block text-sm font-medium text-[#0B0C0E] mb-2"
          >
            Active status
          </label>
          <select
            id="active-status-select"
            value={active ? "YES" : "NO"}
            onChange={(e) => setActive(e.target.value === "YES")}
            className="flex h-9 w-full rounded-md border border-[#DDD8CF] bg-white px-3 py-1.5 text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
          >
            <option value="YES">Yes (Active operational configuration)</option>
            <option value="NO">No (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center space-x-4 pt-4 border-t border-[#EAE7DF]">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Configuration"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/pricing/customer-prices")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
