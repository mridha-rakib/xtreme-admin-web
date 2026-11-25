"use client";

import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth/session";
import { serviceCustomFieldRepository } from "@/lib/mock/service-custom-fields";
import type { CustomFieldDataType, CustomFieldUsage, ServiceCustomField } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

interface CustomFieldFormProps {
  serviceId: string;
  initialData?: ServiceCustomField;
  isEdit?: boolean;
}

export function CustomFieldForm({ serviceId, initialData, isEdit = false }: CustomFieldFormProps) {
  const router = useRouter();
  const { user } = useSession();

  const [fieldKey, setFieldKey] = useState(initialData?.fieldKey || "");
  const [labelEn, setLabelEn] = useState(
    initialData?.localizedLabels?.en || initialData?.label || "",
  );
  const [labelFr, setLabelFr] = useState(initialData?.localizedLabels?.fr || "");
  const [dataType, setDataType] = useState<CustomFieldDataType>(initialData?.dataType || "TEXT");
  const [usage, setUsage] = useState<CustomFieldUsage>(initialData?.usage || "BOOKING_FORM");
  const [required, setRequired] = useState(initialData?.required ?? false);
  const [customerVisible, setCustomerVisible] = useState(initialData?.customerVisible ?? true);
  const [sortOrder, setSortOrder] = useState<number>(initialData?.sortOrder ?? 1);
  const [optionsStr, setOptionsStr] = useState(
    initialData?.options ? initialData.options.join(", ") : "",
  );
  const [defaultValue, setDefaultValue] = useState(
    initialData?.defaultValue !== undefined ? String(initialData.defaultValue) : "",
  );
  const [placeholder, setPlaceholder] = useState(initialData?.placeholder || "");
  const [helpText, setHelpText] = useState(initialData?.helpText || "");
  const [active, setActive] = useState(
    initialData?.active !== undefined ? initialData.active : true,
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSelectType = dataType === "SELECT" || dataType === "MULTI_SELECT";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("You must be authenticated to modify custom fields.");
      return;
    }

    if (!fieldKey.trim()) {
      setErrorMessage("Field Key identifier is required.");
      return;
    }

    if (!labelEn.trim()) {
      setErrorMessage("English label is required.");
      return;
    }

    if (isSelectType) {
      const parsedOptions = optionsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsedOptions.length === 0) {
        setErrorMessage("Please enter at least one option for SELECT data types.");
        return;
      }
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const parsedOptions = isSelectType
        ? optionsStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

      if (isEdit && initialData) {
        serviceCustomFieldRepository.updateField(user, {
          fieldId: initialData.id,
          fieldKey: fieldKey.trim(),
          label: labelEn.trim(),
          localizedLabels: {
            en: labelEn.trim(),
            fr: labelFr.trim() || labelEn.trim(),
          },
          dataType,
          usage,
          required,
          customerVisible,
          sortOrder: Number(sortOrder) || 1,
          options: parsedOptions,
          defaultValue: defaultValue ? defaultValue : undefined,
          placeholder: placeholder.trim() || undefined,
          helpText: helpText.trim() || undefined,
          active,
          expectedVersion: initialData.version,
        });
      } else {
        serviceCustomFieldRepository.createField(user, {
          serviceId,
          fieldKey: fieldKey.trim(),
          label: labelEn.trim(),
          localizedLabels: {
            en: labelEn.trim(),
            fr: labelFr.trim() || labelEn.trim(),
          },
          dataType,
          usage,
          required,
          customerVisible,
          sortOrder: Number(sortOrder) || 1,
          options: parsedOptions,
          defaultValue: defaultValue ? defaultValue : undefined,
          placeholder: placeholder.trim() || undefined,
          helpText: helpText.trim() || undefined,
          active,
        });
      }

      router.push(`/catalog/services/${serviceId}/custom-fields`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving custom field.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] text-sm">
          <span className="font-semibold">Validation Error: </span>
          {errorMessage}
        </div>
      )}

      {/* Field Identification */}
      <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0B0C0E]">Field Identity &amp; Key</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field-key-input"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Field Key (Identifier) *
            </label>
            <input
              id="field-key-input"
              type="text"
              required
              placeholder="e.g. pax_count or aircraft_tail_preference"
              value={fieldKey}
              onChange={(e) =>
                setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
              }
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm font-mono text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
            <span className="text-[11px] text-[#8C8F97] mt-1 block">
              Unique programmatic identifier for booking payload and API responses
            </span>
          </div>

          <div>
            <label
              htmlFor="field-sort-input"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Sort Order
            </label>
            <input
              id="field-sort-input"
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field-label-en-input"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Label (English) *
            </label>
            <input
              id="field-label-en-input"
              type="text"
              required
              placeholder="e.g. Passenger Count"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>

          <div>
            <label
              htmlFor="field-label-fr-input"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Label (French)
            </label>
            <input
              id="field-label-fr-input"
              type="text"
              placeholder="e.g. Nombre de passagers"
              value={labelFr}
              onChange={(e) => setLabelFr(e.target.value)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
        </div>
      </div>

      {/* Field Data Type & Usage */}
      <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0B0C0E]">Data Type &amp; Usage Governance</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field-datatype-select"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Data Type *
            </label>
            <select
              id="field-datatype-select"
              value={dataType}
              onChange={(e) => setDataType(e.target.value as CustomFieldDataType)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="TEXT">TEXT (Single line string)</option>
              <option value="NUMBER">NUMBER (Integer or numeric value)</option>
              <option value="BOOLEAN">BOOLEAN (Yes/No checkbox)</option>
              <option value="SELECT">SELECT (Single choice from list)</option>
              <option value="MULTI_SELECT">MULTI SELECT (Multiple choice tags)</option>
              <option value="DATE">DATE (Calendar date)</option>
              <option value="DATETIME">DATETIME (Date &amp; timestamp)</option>
              <option value="TEXTAREA">TEXTAREA (Multi-line detailed text)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="field-usage-select"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Usage Scope *
            </label>
            <select
              id="field-usage-select"
              value={usage}
              onChange={(e) => setUsage(e.target.value as CustomFieldUsage)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="BOOKING_FORM">BOOKING FORM (Customer booking intake)</option>
              <option value="INTERNAL_OPS">
                INTERNAL OPS (Command Center &amp; Vendor operations)
              </option>
              <option value="INVOICE">INVOICE (Accounting &amp; billing statements)</option>
            </select>
          </div>
        </div>

        {isSelectType && (
          <div>
            <label
              htmlFor="field-options-input"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Select Options (Comma-separated) *
            </label>
            <input
              id="field-options-input"
              type="text"
              required
              placeholder="e.g. Gulfstream G650, Bombardier Global 7500, Citation X"
              value={optionsStr}
              onChange={(e) => setOptionsStr(e.target.value)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field-placeholder-input"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Placeholder Text
            </label>
            <input
              id="field-placeholder-input"
              type="text"
              placeholder="e.g. Enter passenger count..."
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>

          <div>
            <label
              htmlFor="field-default-val-input"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Default Value
            </label>
            <input
              id="field-default-val-input"
              type="text"
              placeholder="e.g. 2"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="field-helptext-input"
            className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
          >
            Help Text / Instructions
          </label>
          <input
            id="field-helptext-input"
            type="text"
            placeholder="Guidance displayed beneath the input on customer reservation form..."
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
          />
        </div>
      </div>

      {/* Visibility & Requirements */}
      <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-[#0B0C0E]">Validation &amp; Visibility</h2>

        <div className="flex flex-col sm:flex-row gap-6 pt-2">
          <label
            htmlFor="field-req-check"
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <input
              id="field-req-check"
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 rounded text-[#0B0C0E] border-[#DDD8CF] focus:ring-0"
            />
            <span className="text-sm font-semibold text-[#0B0C0E]">
              Required Field (Validation Enforced)
            </span>
          </label>

          <label
            htmlFor="field-vis-check"
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <input
              id="field-vis-check"
              type="checkbox"
              checked={customerVisible}
              onChange={(e) => setCustomerVisible(e.target.checked)}
              className="w-4 h-4 rounded text-[#0B0C0E] border-[#DDD8CF] focus:ring-0"
            />
            <span className="text-sm font-semibold text-[#0B0C0E]">
              Customer Visible in Reservation Journey
            </span>
          </label>

          <label
            htmlFor="field-active-check"
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <input
              id="field-active-check"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#0B0C0E] border-[#DDD8CF] focus:ring-0"
            />
            <span className="text-sm font-semibold text-[#0B0C0E]">
              Active (Preserves Historical Bookings)
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href={`/catalog/services/${serviceId}/custom-fields`}>
          <Button
            type="button"
            variant="secondary"
            className="h-[44px] px-5 border border-[#DDD8CF] rounded-xl text-sm font-semibold hover:bg-[#FAF8F4]"
          >
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-[44px] px-6 bg-[#0B0C0E] hover:bg-[#17191D] text-white rounded-xl text-sm font-semibold shadow-sm"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Update Custom Field" : "Create Custom Field"}
        </Button>
      </div>
    </form>
  );
}
