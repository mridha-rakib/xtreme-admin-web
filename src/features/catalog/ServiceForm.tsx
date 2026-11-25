"use client";

import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth/session";
import { catalogRepository } from "@/lib/mock/catalog";
import { serviceRepository } from "@/lib/mock/services";
import type {
  AvailabilityModel,
  CatalogCategory,
  CatalogService,
  PaymentMode,
  ServiceBookingMode,
  ServiceTemplate,
} from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

interface ServiceFormProps {
  initialData?: CatalogService;
  isEdit?: boolean;
}

export function ServiceForm({ initialData, isEdit = false }: ServiceFormProps) {
  const router = useRouter();
  const { user } = useSession();

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugManual, setIsSlugManual] = useState(Boolean(initialData?.slug));
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [template, setTemplate] = useState<ServiceTemplate>(initialData?.template || "AIR_CHARTER");
  const [bookingMode, setBookingMode] = useState<ServiceBookingMode>(
    initialData?.bookingMode || "QUOTE_REQUIRED",
  );
  const [availabilityModel, setAvailabilityModel] = useState<AvailabilityModel>(
    initialData?.availabilityModel || "DURATION_BASED",
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    initialData?.paymentMode || "PREPAYMENT",
  );
  const [descriptionEn, setDescriptionEn] = useState(
    initialData?.localizedDescriptions?.en || initialData?.description || "",
  );
  const [descriptionFr, setDescriptionFr] = useState(initialData?.localizedDescriptions?.fr || "");
  const [active, setActive] = useState(
    initialData?.active !== undefined ? initialData.active : true,
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cats = catalogRepository.listCategories();
    setCategories(cats);
    if (!categoryId && cats.length > 0) {
      setCategoryId(cats[0].id);
    }
  }, [categoryId]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual && !isEdit) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generated);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("You must be signed in to perform this action.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Service name is required.");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Please select a parent category.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (isEdit && initialData) {
        serviceRepository.updateService(user, {
          serviceId: initialData.id,
          name: name.trim(),
          slug: slug.trim() || undefined,
          categoryId,
          template,
          bookingMode,
          availabilityModel,
          paymentMode,
          localizedDescriptions: {
            en: descriptionEn.trim() || name.trim(),
            fr: descriptionFr.trim() || name.trim(),
          },
          active,
          expectedVersion: initialData.version,
        });
        router.push(`/catalog/services/${initialData.id}`);
      } else {
        const created = serviceRepository.createService(user, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          categoryId,
          template,
          bookingMode,
          availabilityModel,
          paymentMode,
          localizedDescriptions: {
            en: descriptionEn.trim() || name.trim(),
            fr: descriptionFr.trim() || name.trim(),
          },
          active,
        });
        router.push(`/catalog/services/${created.id}`);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving the service.");
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

      {/* Main Attributes */}
      <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0B0C0E]">General Identification</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="service-name-input"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Service Name (English) *
            </label>
            <input
              id="service-name-input"
              type="text"
              required
              placeholder="e.g. Executive Chauffeur Transfer"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>

          <div>
            <label
              htmlFor="service-slug-input"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              URL Slug *
            </label>
            <input
              id="service-slug-input"
              type="text"
              required
              placeholder="executive-chauffeur-transfer"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManual(true);
              }}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm font-mono text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="service-category-select"
            className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
          >
            Parent Category *
          </label>
          <select
            id="service-category-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.parentName ? `(Subcategory of ${c.parentName})` : "(Root Category)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Operational Governance */}
      <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0B0C0E]">Operational &amp; Booking Governance</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="service-template-select"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Execution Template *
            </label>
            <select
              id="service-template-select"
              value={template}
              onChange={(e) => setTemplate(e.target.value as ServiceTemplate)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="AIR_CHARTER">AIR CHARTER</option>
              <option value="YACHT_CHARTER">YACHT CHARTER</option>
              <option value="CHAUFFEUR_TRANSFER">CHAUFFEUR TRANSFER</option>
              <option value="FINE_DINING">FINE DINING</option>
              <option value="SECURITY_DETAIL">SECURITY DETAIL</option>
              <option value="CUSTOM">CUSTOM</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="service-bookingmode-select"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Booking Mode *
            </label>
            <select
              id="service-bookingmode-select"
              value={bookingMode}
              onChange={(e) => setBookingMode(e.target.value as ServiceBookingMode)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="QUOTE_REQUIRED">QUOTE REQUIRED (Concierge Manual Quoting)</option>
              <option value="INSTANT_CONFIRMATION">
                INSTANT CONFIRMATION (Automated Slot Lock)
              </option>
              <option value="MANUAL_APPROVAL">MANUAL APPROVAL (Vendor Approval Gate)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="service-avail-select"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Availability Model *
            </label>
            <select
              id="service-avail-select"
              value={availabilityModel}
              onChange={(e) => setAvailabilityModel(e.target.value as AvailabilityModel)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="SCHEDULED_SLOTS">SCHEDULED SLOTS (Fixed calendar windows)</option>
              <option value="DURATION_BASED">DURATION BASED (Hourly/Block reservation)</option>
              <option value="PER_DIEM">PER DIEM (Full 24h day charter)</option>
              <option value="ON_DEMAND">ON DEMAND (Flexible dispatch)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="service-payment-select"
              className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
            >
              Payment Mode *
            </label>
            <select
              id="service-payment-select"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full h-[40px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            >
              <option value="PREPAYMENT">PREPAYMENT (100% upfront card/wire)</option>
              <option value="DEPOSIT_AND_BALANCE">
                DEPOSIT &amp; BALANCE (50% deposit, remainder before departure)
              </option>
              <option value="INVOICE_AFTER_COMPLETION">
                INVOICE AFTER COMPLETION (VIP Principal account)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Localized Descriptions */}
      <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0B0C0E]">Localized Descriptions</h2>

        <div>
          <label
            htmlFor="service-desc-en"
            className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
          >
            English Description
          </label>
          <textarea
            id="service-desc-en"
            rows={3}
            placeholder="Describe the service offering, included amenities, and operational protocol..."
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            className="w-full p-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
          />
        </div>

        <div>
          <label
            htmlFor="service-desc-fr"
            className="block text-xs font-semibold text-[#5B616B] uppercase tracking-wider mb-1"
          >
            French Description
          </label>
          <textarea
            id="service-desc-fr"
            rows={3}
            placeholder="Description détaillée de la prestation en français pour la clientèle francophone..."
            value={descriptionFr}
            onChange={(e) => setDescriptionFr(e.target.value)}
            className="w-full p-3 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
          />
        </div>

        <div className="pt-2">
          <label
            htmlFor="service-active-checkbox"
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <input
              id="service-active-checkbox"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#0B0C0E] border-[#DDD8CF] focus:ring-0"
            />
            <span className="text-sm font-semibold text-[#0B0C0E]">
              Active in Command Center and Customer Reservations
            </span>
          </label>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={isEdit && initialData ? `/catalog/services/${initialData.id}` : "/catalog/services"}
        >
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
          {isSubmitting ? "Saving..." : isEdit ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
}
